<template>
  <div class="app-header-bar">
    <div class="header-left">
      <el-icon class="toggle-btn" @click="toggleSidebar">
        <Fold v-if="!sidebarCollapsed" />
        <Expand v-else />
      </el-icon>
      <span class="system-title">工业维修管理系统</span>
    </div>
    <div class="header-right">
      <el-select
        :model-value="currentUser.role"
        size="small"
        style="width: 120px"
        @change="handleRoleChange"
      >
        <el-option label="报修人" value="reporter" />
        <el-option label="检修人" value="worker" />
      </el-select>
      <span class="user-name">{{ currentUser.name || '未登录' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Fold, Expand } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import { useUserStore, type UserRole } from '../../stores/user'

const appStore = useAppStore()
const userStore = useUserStore()

const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const currentUser = computed(() => userStore.currentUser)

function toggleSidebar() {
  appStore.toggleSidebar()
}

function handleRoleChange(role: UserRole) {
  userStore.setUser(currentUser.value.name, role)
}
</script>

<style scoped>
.app-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-btn {
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.toggle-btn:hover {
  color: var(--color-accent);
}

.system-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-name {
  font-size: 14px;
  color: var(--text-secondary);
}
</style>
