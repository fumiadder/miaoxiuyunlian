import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type UserRole = 'reporter' | 'worker'

const STORAGE_KEY = 'maintenance_user'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<{
    id: number
    name: string
    role: UserRole
    token: string
    is_admin: boolean
    department: string
  }>({
    id: 0,
    name: '',
    role: 'worker',
    token: '',
    is_admin: false,
    department: '',
  })

  const isLoggedIn = computed(() => !!currentUser.value.token)

  function login(id: number, name: string, role: UserRole, token: string, is_admin: boolean = false, department: string = '') {
    currentUser.value = {
      id,
      name: name.trim(),
      role,
      token,
      is_admin,
      department,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser.value))
  }

  function logout() {
    currentUser.value = { id: 0, name: '', role: 'worker', token: '', is_admin: false, department: '' }
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
