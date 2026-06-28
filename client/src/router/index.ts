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
  // 报修人页面
  {
    path: '/spare-parts/query',
    name: 'SparePartQuery',
    component: () => import('../views/spare-parts/SparePartQuery.vue'),
    meta: { roles: ['reporter', 'worker'] },
  },
  {
    path: '/spare-parts/material-plan',
    name: 'MaterialPlanQuery',
    component: () => import('../views/spare-parts/MaterialPlanQuery.vue'),
    meta: { roles: ['reporter', 'worker'] },
  },
  {
    path: '/fault/dispatch',
    name: 'FaultDispatch',
    component: () => import('../views/fault/FaultDispatch.vue'),
    meta: { roles: ['worker'] },
  },
  {
    path: '/fault/list',
    name: 'FaultList',
    component: () => import('../views/fault/FaultList.vue'),
    meta: { roles: ['worker'] },
  },
  {
    path: '/fault/:id',
    name: 'FaultDetail',
    component: () => import('../views/fault/FaultDetail.vue'),
    meta: { roles: ['reporter', 'worker'] },
  },
  {
    path: '/repair/submit',
    name: 'RepairSubmit',
    component: () => import('../views/repair/RepairSubmit.vue'),
    meta: { roles: ['reporter'] },
  },
  {
    path: '/repair/tracking',
    name: 'RepairTracking',
    component: () => import('../views/repair/RepairTracking.vue'),
    meta: { roles: ['reporter'] },
  },
  {
    path: '/repair/workbench',
    name: 'RepairWorkbench',
    component: () => import('../views/repair/RepairWorkbench.vue'),
    meta: { roles: ['worker'] },
  },
  {
    path: '/report/dashboard',
    name: 'ReportDashboard',
    component: () => import('../views/report/ReportDashboard.vue'),
    meta: { roles: ['reporter', 'worker'] },
  },
  {
    path: '/schedule/manage',
    name: 'ScheduleManage',
    component: () => import('../views/schedule/ScheduleManage.vue'),
    meta: { roles: ['worker'] },
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
      // 已登录访问登录页，重定向到首页
      const target = userStore.currentUser.role === 'reporter' ? '/repair/submit' : '/repair/workbench'
      return next(target)
    }
    return next()
  }

  // 未登录跳转登录页
  if (!userStore.isLoggedIn) {
    return next('/login')
  }

  // 角色权限检查
  const roles = to.meta.roles as string[] | undefined
  if (roles && !roles.includes(userStore.currentUser.role)) {
    // 无权限，跳转到各自首页
    const fallback = userStore.currentUser.role === 'reporter' ? '/repair/submit' : '/repair/workbench'
    return next(fallback)
  }

  next()
})

export default router
