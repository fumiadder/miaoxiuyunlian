<template>
  <div class="fault-list">
    <el-card shadow="never">
      <template #header>
        <span>故障记录</span>
      </template>

      <!-- 筛选区 -->
      <div class="filter-bar">
        <el-select v-model="filters.fault_type" placeholder="故障类型" clearable style="width: 150px">
          <el-option label="机械故障" value="mechanical" />
          <el-option label="电气故障" value="electrical" />
          <el-option label="液压故障" value="hydraulic" />
          <el-option label="软件故障" value="software" />
        </el-select>
        <el-select v-model="filters.status" placeholder="状态" clearable style="width: 150px">
          <el-option label="待派单" value="pending" />
          <el-option label="已派单" value="dispatched" />
          <el-option label="已接单" value="accepted" />
          <el-option label="维修中" value="repairing" />
          <el-option label="已完成" value="completed" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 260px"
        />
        <el-button type="primary" @click="fetchData">查询</el-button>
        <el-button @click="resetFilters">重置</el-button>
      </div>

      <!-- 数据表格 -->
      <el-table :data="list" stripe style="width: 100%; margin-top: 16px">
        <el-table-column prop="fault_no" label="故障编号" width="140" />
        <el-table-column prop="device_name" label="设备名称" min-width="140" />
        <el-table-column label="故障类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">
              {{ FAULT_TYPE_MAP[row.fault_type] || row.fault_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="assignee_name" label="负责人" width="100" />
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

      <!-- 分页 -->
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { getFaultList } from '../../api/fault'
import { FAULT_TYPE_MAP } from '../../types/fault'
import type { FaultRecord } from '../../types/fault'

const list = ref<FaultRecord[]>([])
const dateRange = ref<string[]>([])

const filters = reactive({
  fault_type: '',
  status: '',
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0,
})

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

function resetFilters() {
  filters.fault_type = ''
  filters.status = ''
  dateRange.value = []
  pagination.page = 1
  fetchData()
}

async function fetchData() {
  try {
    const res = await getFaultList({
      fault_type: filters.fault_type || undefined,
      status: filters.status || undefined,
      start_date: dateRange.value[0] || undefined,
      end_date: dateRange.value[1] || undefined,
      page: pagination.page,
      page_size: pagination.page_size,
    })
    list.value = res.data.list
    pagination.total = res.data.total
  } catch {
    // error handled by interceptor
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.filter-bar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
