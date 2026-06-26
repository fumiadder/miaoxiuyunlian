import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/spare-parts/query',
  },
  {
    path: '/spare-parts/query',
    name: 'SparePartQuery',
    component: () => import('../views/spare-parts/SparePartQuery.vue'),
  },
  {
    path: '/spare-parts/material-plan',
    name: 'MaterialPlanQuery',
    component: () => import('../views/spare-parts/MaterialPlanQuery.vue'),
  },
  {
    path: '/fault/dispatch',
    name: 'FaultDispatch',
    component: () => import('../views/fault/FaultDispatch.vue'),
  },
  {
    path: '/fault/list',
    name: 'FaultList',
    component: () => import('../views/fault/FaultList.vue'),
  },
  {
    path: '/fault/:id',
    name: 'FaultDetail',
    component: () => import('../views/fault/FaultDetail.vue'),
  },
  {
    path: '/repair/submit',
    name: 'RepairSubmit',
    component: () => import('../views/repair/RepairSubmit.vue'),
  },
  {
    path: '/repair/tracking',
    name: 'RepairTracking',
    component: () => import('../views/repair/RepairTracking.vue'),
  },
  {
    path: '/repair/workbench',
    name: 'RepairWorkbench',
    component: () => import('../views/repair/RepairWorkbench.vue'),
  },
  {
    path: '/report/dashboard',
    name: 'ReportDashboard',
    component: () => import('../views/report/ReportDashboard.vue'),
  },
  {
    path: '/schedule/manage',
    name: 'ScheduleManage',
    component: () => import('../views/schedule/ScheduleManage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
