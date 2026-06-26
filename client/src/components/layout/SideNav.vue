<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="sidebarCollapsed"
    :collapse-transition="false"
    router
    class="side-nav"
    background-color="transparent"
    text-color="var(--text-secondary)"
    active-text-color="var(--color-accent)"
  >
    <el-menu-item index="/spare-parts/query">
      <el-icon><Search /></el-icon>
      <template #title>备件查询</template>
    </el-menu-item>

    <el-sub-menu index="spare-parts-plan">
      <template #title>
        <el-icon><Box /></el-icon>
        <span>备件管理</span>
      </template>
      <el-menu-item index="/spare-parts/query">备件查询</el-menu-item>
      <el-menu-item index="/spare-parts/material-plan">备件材料计划表</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="fault-mgmt">
      <template #title>
        <el-icon><Warning /></el-icon>
        <span>故障管理</span>
      </template>
      <el-menu-item index="/fault/dispatch">故障派单</el-menu-item>
      <el-menu-item index="/fault/list">故障记录</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="repair-mgmt">
      <template #title>
        <el-icon><SetUp /></el-icon>
        <span>报修管理</span>
      </template>
      <el-menu-item index="/repair/submit">报修拍照派单</el-menu-item>
      <el-menu-item index="/repair/tracking">报修进度跟踪</el-menu-item>
      <el-menu-item index="/repair/workbench">检修工作台</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="report-center">
      <template #title>
        <el-icon><DataAnalysis /></el-icon>
        <span>报表中心</span>
      </template>
      <el-menu-item index="/report/dashboard">统计仪表盘</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="schedule-mgmt">
      <template #title>
        <el-icon><Calendar /></el-icon>
        <span>排班管理</span>
      </template>
      <el-menu-item index="/schedule/manage">排班表</el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../../stores/app'
import {
  Search,
  Box,
  Warning,
  SetUp,
  DataAnalysis,
  Calendar,
} from '@element-plus/icons-vue'

const route = useRoute()
const appStore = useAppStore()

const sidebarCollapsed = computed(() => appStore.sidebarCollapsed)
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.side-nav {
  height: 100%;
  border-right: none;
}

.side-nav:not(.el-menu--collapse) {
  width: 220px;
}

.side-nav .el-menu-item.is-active {
  background-color: var(--bg-tertiary);
  border-right: 2px solid var(--color-accent);
}

.side-nav .el-menu-item:hover,
.side-nav :deep(.el-sub-menu__title:hover) {
  background-color: var(--bg-tertiary);
}
</style>
