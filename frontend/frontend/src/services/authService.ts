import api from './api'

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', response.data.token)
    return response.data
},

  register: async (nom: string, email: string, password: string, role: string) => {
    const response = await api.post('/auth/register', { nom, email, password, role })
    localStorage.setItem('token', response.data.token)
    return response.data
  },

  logout: () => {
    localStorage.removeItem('token')
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  }
}