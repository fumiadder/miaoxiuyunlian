<template>
  <div class="report-dashboard">
    <!-- 日期选择器 -->
    <el-card shadow="never" class="date-card">
      <div class="date-bar">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
        <el-button type="primary" @click="refreshAllData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </el-card>

    <!-- 模块1：故障统计 -->
    <el-card shadow="never" class="module-card">
      <template #header>
        <span>故障统计</span>
      </template>
      <div class="charts-row">
        <v-chart class="chart-item" :option="barOption" autoresize />
        <v-chart class="chart-item" :option="pieOption" autoresize />
      </div>
    </el-card>

    <!-- 模块2：周期备品备件消耗台账 -->
    <el-card shadow="never" class="module-card">
      <template #header>
        <span>周期备品备件消耗台账</span>
      </template>
      <el-table :data="sparePartsList" stripe style="width: 100%">
        <el-table-column prop="name" label="备件名称" min-width="120" />
        <el-table-column prop="spec" label="规格型号" width="120" />
        <el-table-column prop="quantity" label="消耗数量" width="100" align="center" />
        <el-table-column prop="unit" label="单位" width="80" align="center" />
        <el-table-column prop="device_name" label="使用设备" min-width="120" />
        <el-table-column prop="date" label="消耗日期" width="120" />
        <el-table-column prop="operator" label="操作人" width="100" />
      </el-table>
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="sparePagination.page"
          v-model:page-size="sparePagination.page_size"
          :total="sparePagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchSpareParts"
          @current-change="fetchSpareParts"
        />
      </div>
    </el-card>

    <!-- 模块3：报修派单详情 -->
    <el-card shadow="never" class="module-card">
      <template #header>
        <span>报修派单详情</span>
      </template>
      <el-table :data="dispatchList" stripe style="width: 100%">
        <el-table-column prop="fault_no" label="工单编号" width="140" />
        <el-table-column prop="device_name" label="设备名称" min-width="120" />
        <el-table-column prop="fault_description" label="故障描述" min-width="180" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusBadge :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column prop="assignee_name" label="负责人" width="100" />
        <el-table-column label="进度" min-width="150">
          <template #default="{ row }">
            <el-progress
              :percentage="getProgress(row.status)"
              :stroke-width="6"
            />
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="dispatchPagination.page"
          v-model:page-size="dispatchPagination.page_size"
          :total="dispatchPagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchDispatchDetail"
          @current-change="fetchDispatchDetail"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { getFaultStats, getSparePartsConsumption, getDispatchDetail } from '../../api/report'
import { FAULT_TYPE_MAP, FAULT_STATUS_MAP } from '../../types/fault'
import type { FaultRecord, FaultStatus } from '../../types/fault'

use([CanvasRenderer, BarChart, PieChart, TitleComponent, TooltipComponent, LegendComponent, GridComponent])

const dateRange = ref<string[]>([])

// 故障统计数据
const faultStats = ref<{ by_type: Record<string, number>; by_status: Record<string, number> }>({
  by_type: {},
  by_status: {},
})

// 备件消耗数据
const sparePartsList = ref<any[]>([])
const sparePagination = reactive({ page: 1, page_size: 10, total: 0 })

// 派单详情数据
const dispatchList = ref<FaultRecord[]>([])
const dispatchPagination = reactive({ page: 1, page_size: 10, total: 0 })

function getProgress(status: FaultStatus): number {
  const map: Record<FaultStatus, number> = {
    pending: 10,
    dispatched: 30,
    accepted: 50,
    repairing: 75,
    completed: 100,
  }
  return map[status] || 0
}

// 柱状图配置 - 按故障类型
const barOption = computed(() => ({
  title: { text: '故障类型分布', textStyle: { color: '#e6edf3' } },
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: Object.keys(faultStats.value.by_type).map((k) => FAULT_TYPE_MAP[k] || k),
    axisLabel: { color: '#8b949e' },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#8b949e' },
  },
  series: [
    {
      type: 'bar',
      data: Object.values(faultStats.value.by_type),
      itemStyle: { color: '#f0883e' },
    },
  ],
}))

// 饼图配置 - 按状态
const pieOption = computed(() => ({
  title: { text: '故障状态分布', textStyle: { color: '#e6edf3' } },
  tooltip: { trigger: 'item' },
  legend: {
    orient: 'vertical',
    left: 'left',
    textStyle: { color: '#8b949e' },
  },
  series: [
    {
      type: 'pie',
      radius: '60%',
      data: Object.entries(faultStats.value.by_status).map(([key, value]) => ({
        name: FAULT_STATUS_MAP[key as FaultStatus] || key,
        value,
      })),
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    },
  ],
}))

async function fetchFaultStats() {
  try {
    const res = await getFaultStats({
      start_date: dateRange.value[0] || undefined,
      end_date: dateRange.value[1] || undefined,
    })
    faultStats.value = res.data
  } catch {
    // error handled by interceptor
  }
}

async function fetchSpareParts() {
  try {
    const res = await getSparePartsConsumption({
      start_date: dateRange.value[0] || undefined,
      end_date: dateRange.value[1] || undefined,
      page: sparePagination.page,
      page_size: sparePagination.page_size,
    })
    sparePartsList.value = res.data.list
    sparePagination.total = res.data.total
  } catch {
    // error handled by interceptor
  }
}

async function fetchDispatchDetail() {
  try {
    const res = await getDispatchDetail({
      start_date: dateRange.value[0] || undefined,
      end_date: dateRange.value[1] || undefined,
      page: dispatchPagination.page,
      page_size: dispatchPagination.page_size,
    })
    dispatchList.value = res.data.list
    dispatchPagination.total = res.data.total
  } catch {
    // error handled by interceptor
  }
}

function refreshAllData() {
  fetchFaultStats()
  fetchSpareParts()
  fetchDispatchDetail()
}

onMounted(() => {
  refreshAllData()
})
</script>

<style scoped>
.report-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.date-card {
  margin-bottom: 0;
}

.date-bar {
  display: flex;
  gap: 12px;
  align-items: center;
}

.module-card {
  /* no extra styles needed */
}

.charts-row {
  display: flex;
  gap: 16px;
}

.chart-item {
  flex: 1;
  height: 350px;
}

.pagination-bar {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
