import { defineStore } from 'pinia'
import { ref } from 'vue'

export type UserRole = 'reporter' | 'worker'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<{ name: string; role: UserRole }>({
    name: '',
    role: 'reporter',
  })

  function setUser(name: string, role: UserRole) {
    currentUser.value.name = name
    currentUser.value.role = role
  }

  return { currentUser, setUser }
})
