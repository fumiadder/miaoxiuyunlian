<template>
  <div class="dept-manage-page">
    <div class="page-header">
      <h2 class="page-title">部门管理</h2>
      <el-button v-if="userStore.currentUser.is_admin" type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon> 新增部门
      </el-button>
    </div>

    <el-card class="table-card" shadow="never">
      <el-table :data="deptList" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="部门名称" min-width="160" />
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            <span style="color: #606266;">{{ row.description || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column prop="created_at" label="创建时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column v-if="userStore.currentUser.is_admin" label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEditDialog(row)">
              编辑
            </el-button>
            <el-popconfirm
              title="确定删除该部门吗？"
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

    <!-- 新增/编辑部门弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑部门' : '新增部门'"
      width="480px"
      destroy-on-close
    >
      <el-form
        ref="dialogFormRef"
        :model="dialogForm"
        :rules="dialogRules"
        label-width="100px"
      >
        <el-form-item label="部门名称" prop="name">
          <el-input v-model="dialogForm.name" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="dialogForm.description" placeholder="请输入描述" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="dialogForm.sort_order" :min="0" :max="999" />
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
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../../api/departments'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const loading = ref(false)
const deptList = ref<any[]>([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const dialogFormRef = ref<FormInstance>()

const dialogForm = reactive({
  name: '',
  description: '',
  sort_order: 0,
})

const dialogRules: FormRules = {
  name: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
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

async function fetchDepartments() {
  loading.value = true
  try {
    const res = await getDepartments()
    deptList.value = res.data || res || []
  } catch (error: any) {
    ElMessage.error(error?.message || '获取部门列表失败')
  } finally {
    loading.value = false
  }
}

function resetDialogForm() {
  dialogForm.name = ''
  dialogForm.description = ''
  dialogForm.sort_order = 0
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
  dialogForm.description = row.description || ''
  dialogForm.sort_order = row.sort_order || 0
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
        description: dialogForm.description,
        sort_order: dialogForm.sort_order,
      }
      await updateDepartment(editingId.value, payload)
      ElMessage.success('编辑成功')
    } else {
      await createDepartment({
        name: dialogForm.name,
        description: dialogForm.description,
        sort_order: dialogForm.sort_order,
      })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchDepartments()
  } catch (error: any) {
    ElMessage.error(error?.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await deleteDepartment(id)
    ElMessage.success('删除成功')
    fetchDepartments()
  } catch (error: any) {
    ElMessage.error(error?.message || '删除失败')
  }
}

onMounted(() => {
  fetchDepartments()
})
</script>

<style scoped>
.dept-manage-page {
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
