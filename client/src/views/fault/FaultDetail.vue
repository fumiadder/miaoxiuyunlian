<template>
  <div class="fault-detail">
    <el-card v-if="fault" shadow="never" class="info-card">
      <template #header>
        <div class="card-header">
          <span>故障详情</span>
          <el-button @click="goBack">返回列表</el-button>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="故障编号">
          {{ fault.fault_no }}
        </el-descriptions-item>
        <el-descriptions-item label="设备名称">
          {{ fault.device_name }}
        </el-descriptions-item>
        <el-descriptions-item label="故障类型">
          <el-tag size="small" type="info">
            {{ FAULT_TYPE_MAP[fault.fault_type] || fault.fault_type }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <StatusBadge :status="fault.status" />
        </el-descriptions-item>
        <el-descriptions-item label="负责人">
          {{ fault.assignee_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(fault.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="故障描述" :span="2">
          {{ fault.fault_description }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 处理时间线 -->
    <el-card v-if="timeline.length > 0" shadow="never" class="timeline-card">
      <template #header>
        <span>处理时间线</span>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="(item, index) in timeline"
          :key="index"
          :timestamp="formatDate(item.time)"
          placement="top"
        >
          <div class="timeline-content">
            {{ item.action }}
            <span v-if="item.operator" class="timeline-operator">
              - {{ item.operator }}
            </span>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 案例匹配区域 -->
    <el-card v-if="repairCase" shadow="never" class="case-card">
      <template #header>
        <span>案例匹配</span>
      </template>
      <div class="case-content">
        <h4>{{ repairCase.fault_name }}</h4>
        <p v-if="repairCase.device_name">设备：{{ repairCase.device_name }}</p>
        <div class="case-text">{{ repairCase.case_content }}</div>
      </div>
      <div class="case-actions">
        <el-button type="success" @click="handleCaseFeedback(true)">
          适用此方案
        </el-button>
        <el-button type="danger" @click="showOptimizationDialog = true">
          不适用
        </el-button>
      </div>
    </el-card>

    <!-- 照片区域 -->
    <el-card shadow="never" class="photo-card">
      <template #header>
        <span>照片记录</span>
      </template>
      <div class="photo-grid">
        <div class="photo-section">
          <h4>报修照片</h4>
          <el-image
            v-if="fault?.reporter_photo_url"
            :src="fault.reporter_photo_url"
            fit="cover"
            class="fault-photo"
            :preview-src-list="[fault.reporter_photo_url]"
          />
          <span v-else class="no-photo">暂无照片</span>
        </div>
        <div class="photo-section">
          <h4>完成照片</h4>
          <el-image
            v-if="fault?.completion_photo_url"
            :src="fault.completion_photo_url"
            fit="cover"
            class="fault-photo"
            :preview-src-list="[fault.completion_photo_url]"
          />
          <span v-else class="no-photo">暂无照片</span>
        </div>
      </div>
    </el-card>

    <!-- 反馈填报区域 -->
    <el-card shadow="never" class="feedback-card">
      <template #header>
        <span>反馈填报</span>
      </template>
      <el-input
        v-model="feedbackText"
        type="textarea"
        :rows="4"
        placeholder="请输入反馈信息"
      />
      <div class="feedback-actions">
        <el-button type="primary" :loading="savingFeedback" @click="saveFeedback">
          保存反馈
        </el-button>
      </div>
    </el-card>

    <!-- 优化动作对话框 -->
    <el-dialog v-model="showOptimizationDialog" title="优化动作" width="500px">
      <el-input
        v-model="optimizationText"
        type="textarea"
        :rows="4"
        placeholder="请描述优化动作或建议"
      />
      <template #footer>
        <el-button @click="showOptimizationDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCaseFeedback(false)">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import StatusBadge from '../../components/common/StatusBadge.vue'
import { getFaultDetail, submitFeedback } from '../../api/fault'
import { FAULT_TYPE_MAP } from '../../types/fault'
import type { FaultRecord, TimelineItem, RepairCase } from '../../types/fault'

const route = useRoute()
const router = useRouter()

const fault = ref<FaultRecord | null>(null)
const timeline = ref<TimelineItem[]>([])
const repairCase = ref<RepairCase | null>(null)
const feedbackText = ref('')
const optimizationText = ref('')
const savingFeedback = ref(false)
const showOptimizationDialog = ref(false)

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

function goBack() {
  router.push('/fault/list')
}

async function fetchDetail() {
  const id = route.params.id as string
  try {
    const res = await getFaultDetail(id)
    fault.value = res.data
    timeline.value = res.data.timeline || []
    repairCase.value = res.data.repair_case || null
    feedbackText.value = res.data.feedback_text || ''
  } catch {
    // error handled by interceptor
  }
}

async function handleCaseFeedback(applicable: boolean) {
  if (!fault.value) return
  try {
    await submitFeedback(fault.value.id, {
      case_applicable: applicable,
      feedback_text: applicable ? '案例适用' : feedbackText.value,
      optimization_text: !applicable ? optimizationText.value : undefined,
    })
    showOptimizationDialog.value = false
    repairCase.value = null
    ElMessage.success('反馈已提交')
  } catch {
    // error handled by interceptor
  }
}

async function saveFeedback() {
  if (!fault.value) return
  savingFeedback.value = true
  try {
    await submitFeedback(fault.value.id, {
      case_applicable: false,
      feedback_text: feedbackText.value,
    })
    ElMessage.success('反馈已保存')
  } catch {
    // error handled by interceptor
  } finally {
    savingFeedback.value = false
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.fault-detail {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timeline-content {
  color: var(--text-primary);
}

.timeline-operator {
  color: var(--text-secondary);
  margin-left: 8px;
}

.case-card .case-content {
  margin-bottom: 16px;
}

.case-card .case-content h4 {
  margin-bottom: 8px;
  color: var(--text-primary);
}

.case-card .case-content p {
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.case-text {
  background: var(--bg-tertiary);
  padding: 12px;
  border-radius: 8px;
  white-space: pre-wrap;
  color: var(--text-primary);
}

.case-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.photo-grid {
  display: flex;
  gap: 24px;
}

.photo-section {
  flex: 1;
}

.photo-section h4 {
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.fault-photo {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.no-photo {
  color: var(--text-secondary);
  font-size: 13px;
}

.feedback-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
