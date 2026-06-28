<template>
  <div class="app-header-bar">
    <div class="header-left">
      <el-icon class="toggle-btn" @click="toggleSidebar">
        <Fold v-if="!sidebarCollapsed" />
        <Expand v-else />
      </el-icon>
      <img src="/logo.png" class="header-logo" alt="logo" />
      <span class="system-title">秒修云链</span>
    </div>
    <div class="header-right">
      <el-tag :type="currentUser.role === 'worker' ? 'warning' : 'primary'" size="small">
        {{ currentUser.role === 'worker' ? '检修人' : '报修人' }}
      </el-tag>
      <span class="user-name">{{ currentUser.name || '未登录' }}</span>
      <el-button size="small" type="danger" plain @click="handleLogout">
        退出
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Fold, Expand } from '@element-plus/icons-vue'
import { useAppStore } from '../../stores/app'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const appStore = useAppStore()
const userStore = useUserStore()

const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const currentUser = computed(() => userStore.currentUser)

function toggleSidebar() {
  appStore.toggleSidebar()
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
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

.header-logo {
  height: 32px;
  margin-right: 12px;
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
