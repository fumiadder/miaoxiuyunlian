import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type UserRole = 'reporter' | 'worker'

const STORAGE_KEY = 'maintenance_user'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<{ name: string; role: UserRole; token: string }>({
    name: '',
    role: 'reporter',
    token: '',
  })

  const isLoggedIn = computed(() => !!currentUser.value.token)

  function login(name: string, _password: string, role: UserRole) {
    currentUser.value = {
      name: name.trim(),
      role,
      token: 'local-token-' + Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser.value))
  }

  function logout() {
    currentUser.value = { name: '', role: 'reporter', token: '' }
    localStorage.removeItem(STORAGE_KEY)
  }

  function restoreSession() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        currentUser.value = data
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  // 页面加载时自动恢复
  restoreSession()

  return { currentUser, isLoggedIn, login, logout }
})
