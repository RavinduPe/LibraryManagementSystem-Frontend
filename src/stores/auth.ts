import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    role: localStorage.getItem('role') || '',
  }),

  actions: {
    login(token: string, role: string) {
      this.token = token
      this.role = role
      localStorage.setItem('token', token)
      localStorage.setItem('role', role)
    },

    logout() {
      this.token = ''
      this.role = ''
      localStorage.clear()
    }
  }
})