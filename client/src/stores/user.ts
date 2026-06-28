import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type UserRole = 'reporter' | 'worker'

const STORAGE_KEY = 'maintenance_user'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<{
    name: string
    role: UserRole
    token: string
    is_admin: boolean
  }>({
    name: '',
    role: 'worker',
    token: '',
    is_admin: false,
  })

  const isLoggedIn = computed(() => !!currentUser.value.token)

  function login(name: string, role: UserRole, token: string, is_admin: boolean = false) {
    currentUser.value = {
      name: name.trim(),
      role,
      token,
      is_admin,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser.value))
  }

  function logout() {
    currentUser.value = { name: '', role: 'worker', token: '', is_admin: false }
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

  restoreSession()

  return { currentUser, isLoggedIn, login, logout }
})
