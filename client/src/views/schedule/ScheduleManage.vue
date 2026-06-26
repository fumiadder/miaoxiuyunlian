<template>
  <div class="schedule-manage">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>排班管理</span>
          <div class="header-actions">
            <el-date-picker
              v-model="selectedDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              @change="fetchSchedule"
            />
          </div>
        </div>
      </template>

      <div v-if="scheduleData" class="shifts-container">
        <div
          v-for="shift in scheduleData.shifts"
          :key="shift.shift_id"
          class="shift-section"
          :class="{ 'is-current': shift.shift_id === currentShiftId }"
        >
          <div class="shift-header">
            <h3>
              {{ shift.shift_name }}
              <el-tag
                v-if="shift.shift_id === currentShiftId"
                type="success"
                size="small"
                style="margin-left: 8px"
              >
                当前班次
              </el-tag>
            </h3>
            <span class="shift-time">
              {{ shift.shift_start }} - {{ shift.shift_end }}
            </span>
            <el-button type="primary" size="small" @click="showAddMemberDialog(shift)">
              新增人员
            </el-button>
          </div>

          <el-table :data="shift.members" stripe style="width: 100%">
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="phone" label="电话" width="140" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.is_available ? 'success' : 'danger'" size="small">
                  {{ row.is_available ? '在岗' : '离岗' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="showEditMemberDialog(shift, row)">
                  编辑
                </el-button>
                <el-button type="danger" link size="small" @click="handleDeleteMember(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <el-empty v-else description="暂无排班数据" />
    </el-card>

    <!-- 新增/编辑人员对话框 -->
    <el-dialog v-model="memberDialogVisible" :title="memberDialogTitle" width="400px">
      <el-form label-width="80px">
        <el-form-item label="姓名">
          <el-input v-model="memberForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="memberForm.phone" placeholder="请输入电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="memberDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveMember">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getSchedule, addSchedule, updateSchedule, deleteSchedule } from '../../api/schedule'
import type { ScheduleData, Shift, ScheduleMember } from '../../types/schedule'

const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const scheduleData = ref<ScheduleData | null>(null)
const currentShiftId = ref<number | null>(null)

const memberDialogVisible = ref(false)
const memberDialogTitle = ref('新增人员')
const editingMember = ref<ScheduleMember | null>(null)
const currentShift = ref<Shift | null>(null)

const memberForm = ref({
  name: '',
  phone: '',
})

async function fetchSchedule() {
  try {
    const res = await getSchedule(selectedDate.value)
    scheduleData.value = res.data
    currentShiftId.value = res.data.current_shift?.shift_id || null
  } catch {
    // error handled by interceptor
  }
}

function showAddMemberDialog(shift: Shift) {
  currentShift.value = shift
  editingMember.value = null
  memberForm.value = { name: '', phone: '' }
  memberDialogTitle.value = '新增人员'
  memberDialogVisible.value = true
}

function showEditMemberDialog(shift: Shift, member: ScheduleMember) {
  currentShift.value = shift
  editingMember.value = member
  memberForm.value = { name: member.name, phone: member.phone || '' }
  memberDialogTitle.value = '编辑人员'
  memberDialogVisible.value = true
}

async function handleSaveMember() {
  if (!memberForm.value.name.trim()) {
    ElMessage.warning('请输入姓名')
    return
  }
  if (!currentShift.value || !scheduleData.value) return

  try {
    if (editingMember.value) {
      await updateSchedule(editingMember.value.id, {
        name: memberForm.value.name,
        phone: memberForm.value.phone || undefined,
      })
      ElMessage.success('更新成功')
    } else {
      await addSchedule({
        date: selectedDate.value,
        shift_id: currentShift.value.shift_id,
        name: memberForm.value.name,
        phone: memberForm.value.phone || undefined,
      })
      ElMessage.success('新增成功')
    }
    memberDialogVisible.value = false
    fetchSchedule()
  } catch {
    // error handled by interceptor
  }
}

async function handleDeleteMember(member: ScheduleMember) {
  try {
    await ElMessageBox.confirm(`确定删除人员 "${member.name}" 吗？`, '确认删除', {
      type: 'warning',
    })
    await deleteSchedule(member.id)
    ElMessage.success('删除成功')
    fetchSchedule()
  } catch {
    // cancelled or error
  }
}

onMounted(() => {
  fetchSchedule()
})
</script>

<style scoped>
.schedule-manage {
  /* no extra styles needed */
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.shifts-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.shift-section {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  background: var(--bg-secondary);
}

.shift-section.is-current {
  border-color: var(--color-success);
  box-shadow: 0 0 0 1px var(--color-success);
}

.shift-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.shift-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--text-primary);
}

.shift-time {
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
