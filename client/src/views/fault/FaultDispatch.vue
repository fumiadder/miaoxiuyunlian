<template>
  <div class="fault-dispatch">
    <el-card shadow="never">
      <template #header>
        <span>故障派单</span>
      </template>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="设备名称" prop="device_name">
          <el-input v-model="form.device_name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="故障类型" prop="fault_type">
          <el-select v-model="form.fault_type" placeholder="请选择故障类型" style="width: 100%">
            <el-option label="机械故障" value="mechanical" />
            <el-option label="电气故障" value="electrical" />
            <el-option label="液压故障" value="hydraulic" />
            <el-option label="软件故障" value="software" />
          </el-select>
        </el-form-item>
        <el-form-item label="故障描述" prop="fault_description">
          <el-input
            v-model="form.fault_description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述故障现象"
          />
        </el-form-item>
        <el-form-item label="报修人" prop="reporter_name">
          <el-input v-model="form.reporter_name" placeholder="请输入报修人姓名" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            提交派单
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 派单结果弹窗 -->
    <el-dialog v-model="showResult" title="派单结果" width="500px">
      <div v-if="dispatchResult" class="result-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="故障编号">
            {{ dispatchResult.fault_no }}
          </el-descriptions-item>
          <el-descriptions-item label="维修人">
            {{ dispatchResult.assignee_name }}
          </el-descriptions-item>
          <el-descriptions-item label="班次">
            {{ dispatchResult.shift_id || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showResult = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 案例匹配区域 -->
    <el-card v-if="matchedCase" shadow="never" class="case-card">
      <template #header>
        <span>匹配案例</span>
      </template>
      <div class="case-content">
        <h4>{{ matchedCase.fault_name }}</h4>
        <p>设备：{{ matchedCase.device_name || '-' }}</p>
        <p>处理方案：</p>
        <div class="case-text">{{ matchedCase.case_content }}</div>
      </div>
      <div class="case-actions">
        <el-button type="success" @click="handleCaseApplicable(true)">
          适用此方案
        </el-button>
        <el-button type="danger" @click="handleCaseApplicable(false)">
          不适用
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { createFault, submitFeedback } from '../../api/fault'
import type { FaultRecord, RepairCase } from '../../types/fault'

const formRef = ref<FormInstance>()
const submitting = ref(false)
const showResult = ref(false)
const dispatchResult = ref<FaultRecord | null>(null)
const matchedCase = ref<RepairCase | null>(null)

const form = reactive({
  device_name: '',
  fault_type: '',
  fault_description: '',
  reporter_name: '',
})

const rules: FormRules = {
  device_name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  fault_type: [{ required: true, message: '请选择故障类型', trigger: 'change' }],
  fault_description: [{ required: true, message: '请输入故障描述', trigger: 'blur' }],
  reporter_name: [{ required: true, message: '请输入报修人姓名', trigger: 'blur' }],
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const res = await createFault(form)
    dispatchResult.value = res.data
    showResult.value = true
    ElMessage.success('派单成功')

    // 检查是否有匹配案例
    if (res.data.case_id) {
      matchedCase.value = {
        id: res.data.case_id,
        fault_name: res.data.fault_description,
        fault_type: res.data.fault_type,
        case_content: '案例内容待加载',
        source: 'system',
      }
    }

    // 重置表单
    formRef.value?.resetFields()
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false
  }
}

async function handleCaseApplicable(applicable: boolean) {
  if (!dispatchResult.value) return
  try {
    await submitFeedback(dispatchResult.value.id, {
      case_applicable: applicable,
      feedback_text: applicable ? '案例适用' : '',
    })
    matchedCase.value = null
    ElMessage.success(applicable ? '已标记为适用' : '已标记为不适用')
  } catch {
    // error handled by interceptor
  }
}
</script>

<style scoped>
.fault-dispatch {
  max-width: 700px;
  margin: 0 auto;
}

.case-card {
  margin-top: 16px;
}

.case-content {
  margin-bottom: 16px;
}

.case-content h4 {
  margin-bottom: 8px;
  color: var(--text-primary);
}

.case-content p {
  color: var(--text-secondary);
  margin-bottom: 4px;
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
</style>
