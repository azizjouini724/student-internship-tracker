import api from './api'

export const authService = {

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const data = response.data

    // ✅ Sauvegarder TOUT ce que le backend renvoie
    localStorage.setItem('token',  data.token)
    localStorage.setItem('role',   data.role)
    localStorage.setItem('nom',    data.nom)
    localStorage.setItem('userId', String(data.id))

    return data
  },

  register: async (nom: string, email: string, password: string, role: string) => {
    const response = await api.post('/auth/register', { nom, email, password, role })
    const data = response.data

    localStorage.setItem('token',  data.token)
    localStorage.setItem('role',   data.role)
    localStorage.setItem('nom',    data.nom)
    localStorage.setItem('userId', String(data.id))

    return data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('nom')
    localStorage.removeItem('userId')
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  }
}