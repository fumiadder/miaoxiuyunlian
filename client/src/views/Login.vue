<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <img src="/logo.png" alt="CHINALCO" />
      </div>
      <h1 class="login-title">工业维修管理系统</h1>
      <p class="login-subtitle">中铝集团设备维修管理平台</p>
      <el-form ref="formRef" :model="form" :rules="rules" class="login-form" @submit.prevent="handleLogin">
        <el-form-item prop="name">
          <el-input v-model="form.name" prefix-icon="User" placeholder="请输入用户名" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" prefix-icon="Lock" placeholder="请输入密码" type="password" size="large" show-password />
        </el-form-item>
        <el-form-item prop="role">
          <el-radio-group v-model="form.role" class="role-select">
            <el-radio value="reporter" size="large" border>报修人</el-radio>
            <el-radio value="worker" size="large" border>检修人</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  name: '',
  password: '',
  role: 'reporter' as 'reporter' | 'worker',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    userStore.login(form.name, form.password, form.role)
    ElMessage.success(`欢迎，${form.name}`)
    // 根据角色跳转
    const target = form.role === 'reporter' ? '/repair/submit' : '/repair/workbench'
    router.push(target)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%);
}

.login-card {
  width: 420px;
  padding: 48px 40px 36px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(37, 99, 235, 0.12);
  text-align: center;
}

.login-logo {
  margin-bottom: 16px;
}

.login-logo img {
  height: 64px;
  width: auto;
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-color-primary);
  margin: 0 0 8px;
}

.login-subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 0 0 32px;
}

.login-form {
  text-align: left;
}

.role-select {
  width: 100%;
  display: flex;
  gap: 16px;
}

.role-select :deep(.el-radio) {
  flex: 1;
  margin-right: 0 !important;
  justify-content: center;
}

.login-btn {
  width: 100%;
  font-size: 16px;
  height: 44px;
  margin-top: 8px;
}
</style>
