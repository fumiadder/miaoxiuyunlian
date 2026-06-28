<template>
  <div class="repair-submit">
    <el-card shadow="never">
      <template #header>
        <span>报修拍照派单</span>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="现场照片">
          <PhotoUploader @uploaded="handlePhotoUploaded" />
        </el-form-item>
        <el-form-item label="设备名称" prop="device_name">
          <el-input v-model="form.device_name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="故障现象" prop="fault_description">
          <el-input
            v-model="form.fault_description"
            type="textarea"
            :rows="4"
            placeholder="请描述故障现象"
          />
        </el-form-item>
        <el-form-item label="紧急程度" prop="urgency">
          <el-select v-model="form.urgency" placeholder="请选择紧急程度" style="width: 100%">
            <el-option label="一般" value="normal" />
            <el-option label="紧急" value="urgent" />
            <el-option label="非常紧急" value="critical" />
          </el-select>
        </el-form-item>
        <el-form-item label="报修人" prop="reporter_name">
          <el-input v-model="form.reporter_name" placeholder="请输入报修人姓名" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            提交报修
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import PhotoUploader from '../../components/common/PhotoUploader.vue'
import { createFault } from '../../api/fault'

import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const photoUrl = ref('')

const form = reactive({
  device_name: '',
  fault_description: '',
  urgency: 'normal',
  reporter_name: '',
})

onMounted(() => {
  form.reporter_name = userStore.currentUser.name
})

const rules: FormRules = {
  device_name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  fault_description: [{ required: true, message: '请描述故障现象', trigger: 'blur' }],
  reporter_name: [{ required: true, message: '请输入报修人姓名', trigger: 'blur' }],
}

function handlePhotoUploaded(url: string) {
  photoUrl.value = url
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const faultTypeMap: Record<string, string> = {
      normal: 'mechanical',
      urgent: 'mechanical',
      critical: 'mechanical',
    }
    await createFault({
      device_name: form.device_name,
      fault_type: faultTypeMap[form.urgency] || 'mechanical',
      fault_description: `[${form.urgency === 'critical' ? '非常紧急' : form.urgency === 'urgent' ? '紧急' : '一般'}] ${form.fault_description}`,
      reporter_name: form.reporter_name,
      reporter_photo_url: photoUrl.value || undefined,
    })
    ElMessage.success('报修提交成功')
    formRef.value?.resetFields()
    photoUrl.value = ''
  } catch {
    // error handled by interceptor
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.repair-submit {
  max-width: 700px;
  margin: 0 auto;
}
</style>
