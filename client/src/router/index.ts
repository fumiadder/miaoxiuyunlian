import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { noLayout: true, public: true },
  },
  {
    path: '/',
    redirect: '/repair/submit',
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
  {
    path: '/admin/users',
    name: 'UserManage',
    component: () => import('../views/admin/UserManage.vue'),
  },
  {
    path: '/admin/departments',
    name: 'DepartmentManage',
    component: () => import('../views/admin/DepartmentManage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()

  // 公开页面直接放行
  if (to.meta.public) {
    if (userStore.isLoggedIn) {
      return next('/repair/submit')
    }
    return next()
  }

  // 未登录跳转登录页
  if (!userStore.isLoggedIn) {
    return next('/login')
  }

  // 管理员专属路由拦截
  const adminPaths = ['/admin', '/schedule']
  const isAdminRoute = adminPaths.some(prefix => to.path.startsWith(prefix))
  if (isAdminRoute && !userStore.currentUser.is_admin) {
    return next('/repair/submit')
  }

  next()
})

export default router
