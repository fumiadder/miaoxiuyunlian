<template>
  <div class="user-manage-page">
    <div class="page-header">
      <h2 class="page-title">人员管理</h2>
      <el-button v-if="userStore.currentUser.is_admin" type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon> 新增人员
      </el-button>
    </div>

    <el-card class="table-card" shadow="never">
      <el-table :data="userList" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="用户名" min-width="150" />
        <el-table-column prop="role" label="角色" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.role === 'reporter' ? 'primary' : 'success'">
              {{ row.role === 'reporter' ? '报修人' : '检修人' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_admin" label="是否管理员" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_admin ? 'danger' : 'info'">
              {{ row.is_admin ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-popconfirm
              title="确定删除该人员吗？"
              confirm-button-text="确定"
              cancel-button-text="取消"
              @confirm="handleDelete(row.id)"
            >
              <template #reference>
                <el-button type="danger" link size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑人员弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑人员' : '新增人员'"
      width="480px"
      destroy-on-close
    >
      <el-form
        ref="dialogFormRef"
        :model="dialogForm"
        :rules="dialogRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="name">
          <el-input v-model="dialogForm.name" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!isEdit">
          <el-input v-model="dialogForm.password" placeholder="请输入密码" type="password" show-password />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-else>
          <el-input v-model="dialogForm.password" placeholder="留空则不修改密码" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-radio-group v-model="dialogForm.role">
            <el-radio value="reporter">报修人</el-radio>
            <el-radio value="worker">检修人</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否管理员">
          <el-checkbox v-model="dialogForm.is_admin">管理员</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'
import { getUsers, createUser, updateUser, deleteUser } from '../../api/auth'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const loading = ref(false)
const userList = ref<any[]>([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const dialogFormRef = ref<FormInstance>()

const dialogForm = reactive({
  name: '',
  password: '',
  role: 'reporter' as 'reporter' | 'worker',
  is_admin: false,
})

const dialogRules: FormRules = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: !isEdit.value, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await getUsers()
    userList.value = res.data || res || []
  } catch (error: any) {
    ElMessage.error(error?.message || '获取人员列表失败')
  } finally {
    loading.value = false
  }
}

function resetDialogForm() {
  dialogForm.name = ''
  dialogForm.password = ''
  dialogForm.role = 'reporter'
  dialogForm.is_admin = false
}

function openCreateDialog() {
  isEdit.value = false
  editingId.value = null
  resetDialogForm()
  dialogVisible.value = true
}

function openEditDialog(row: any) {
  isEdit.value = true
  editingId.value = row.id
  dialogForm.name = row.name
  dialogForm.password = ''
  dialogForm.role = row.role
  dialogForm.is_admin = row.is_admin
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await dialogFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (isEdit.value && editingId.value !== null) {
      const payload: any = {
        name: dialogForm.name,
        role: dialogForm.role,
        is_admin: dialogForm.is_admin,
      }
      if (dialogForm.password) {
        payload.password = dialogForm.password
      }
      await updateUser(editingId.value, payload)
      ElMessage.success('编辑成功')
    } else {
      await createUser({
        name: dialogForm.name,
        password: dialogForm.password,
        role: dialogForm.role,
        is_admin: dialogForm.is_admin,
      })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchUsers()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await deleteUser(id)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (error: any) {
    ElMessage.error(error?.message || '删除失败')
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-manage-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
}

.table-card {
  border-radius: 8px;
}
</style>
