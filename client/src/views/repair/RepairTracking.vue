<template>
  <div class="repair-tracking">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>报修进度跟踪</span>
          <el-tag type="info" size="small">每30秒自动刷新</el-tag>
        </div>
      </template>

      <el-table :data="list" stripe style="width: 100%">
        <el-table-column prop="fault_no" label="工单编号" width="140" />
        <el-table-column prop="device_name" label="设备名称" min-width="140" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="assignee_name" label="维修人" width="100">
          <template #default="{ row }">
            {{ row.assignee_name || '待分配' }}
          </template>
        </el-table-column>
        <el-table-column label="进度" min-width="200">
          <template #default="{ row }">
            <el-progress
              :percentage="getProgress(row.status)"
              :stroke-width="6"
              :format="() => FAULT_STATUS_MAP[row.status]"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <router-link :to="`/fault/${row.id}`">
              <el-button type="primary" link size="small">查看详情</el-button>
            </router-link>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { getFaultList } from '../../api/fault'
import { FAULT_STATUS_MAP } from '../../types/fault'
import type { FaultRecord, FaultStatus } from '../../types/fault'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const list = ref<FaultRecord[]>([])
let pollTimer: ReturnType<typeof setInterval> | null = null

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

function getProgress(status: FaultStatus): number {
  const progressMap: Record<FaultStatus, number> = {
    pending: 10,
    dispatched: 30,
    accepted: 50,
    repairing: 75,
    completed: 100,
  }
  return progressMap[status] || 0
}

async function fetchData() {
  try {
    const res = await getFaultList({
      reporter_name: userStore.currentUser.name,
      page: 1,
      page_size: 50,
    })
    list.value = res.data.list
  } catch {
    // error handled by interceptor
  }
}

onMounted(() => {
  fetchData()
  pollTimer = setInterval(fetchData, 30000)
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
