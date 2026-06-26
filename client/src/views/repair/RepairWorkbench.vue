<template>
  <div class="repair-workbench">
    <el-card shadow="never">
      <template #header>
        <span>检修工作台</span>
      </template>

      <el-table :data="list" stripe style="width: 100%">
        <el-table-column prop="fault_no" label="工单编号" width="140" />
        <el-table-column prop="device_name" label="设备名称" min-width="140" />
        <el-table-column prop="fault_description" label="故障描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'dispatched'"
              type="primary"
              size="small"
              @click="handleAccept(row)"
            >
              接单
            </el-button>
            <el-button
              v-if="row.status === 'accepted'"
              type="warning"
              size="small"
              @click="handleStartRepair(row)"
            >
              开始维修
            </el-button>
            <el-button
              v-if="row.status === 'repairing'"
              type="success"
              size="small"
              @click="showCompleteDialog(row)"
            >
              完成维修
            </el-button>
            <router-link :to="`/fault/${row.id}`">
              <el-button type="info" link size="small">详情</el-button>
            </router-link>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 完成维修对话框 -->
    <el-dialog v-model="completeDialogVisible" title="完成维修" width="500px">
      <el-form label-width="80px">
        <el-form-item label="维修说明">
          <el-input
            v-model="repairDescription"
            type="textarea"
            :rows="3"
            placeholder="请填写维修说明"
          />
        </el-form-item>
        <el-form-item label="完成照片">
          <PhotoUploader @uploaded="handleCompletionPhoto" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="completing" @click="handleComplete">
          确认完成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import StatusBadge from '../../components/common/StatusBadge.vue'
import PhotoUploader from '../../components/common/PhotoUploader.vue'
import { getFaultList, acceptFault, updateFaultStatus } from '../../api/fault'
import type { FaultRecord } from '../../types/fault'

const list = ref<FaultRecord[]>([])
const completeDialogVisible = ref(false)
const currentFault = ref<FaultRecord | null>(null)
const repairDescription = ref('')
const completionPhotoUrl = ref('')
const completing = ref(false)

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

async function fetchData() {
  try {
    const res = await getFaultList({
      assignee_name: 'current_worker',
      page: 1,
      page_size: 50,
    })
    list.value = res.data.list
  } catch {
    // error handled by interceptor
  }
}

async function handleAccept(row: FaultRecord) {
  try {
    await acceptFault(row.id, 'current_worker')
    ElMessage.success('接单成功')
    fetchData()
  } catch {
    // error handled by interceptor
  }
}

async function handleStartRepair(row: FaultRecord) {
  try {
    await updateFaultStatus(row.id, {
      status: 'repairing',
      operator_name: 'current_worker',
    })
    ElMessage.success('已更新为维修中')
    fetchData()
  } catch {
    // error handled by interceptor
  }
}

function showCompleteDialog(row: FaultRecord) {
  currentFault.value = row
  repairDescription.value = ''
  completionPhotoUrl.value = ''
  completeDialogVisible.value = true
}

function handleCompletionPhoto(url: string) {
  completionPhotoUrl.value = url
}

async function handleComplete() {
  if (!currentFault.value) return
  completing.value = true
  try {
    await updateFaultStatus(currentFault.value.id, {
      status: 'completed',
      completion_photo_url: completionPhotoUrl.value || undefined,
      repair_description: repairDescription.value,
      operator_name: 'current_worker',
    })
    ElMessage.success('维修已完成')
    completeDialogVisible.value = false
    fetchData()
  } catch {
    // error handled by interceptor
  } finally {
    completing.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.repair-workbench {
  /* no extra styles needed */
}
</style>
