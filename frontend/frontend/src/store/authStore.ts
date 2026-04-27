import { create } from 'zustand'

interface AuthState {
  token: string | null
  role: string | null
  nom: string | null
  setAuth: (token: string, role: string, nom: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  role: localStorage.getItem('role'),
  nom: localStorage.getItem('nom'),

  setAuth: (token, role, nom) => {
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
    localStorage.setItem('nom', nom)
    set({ token, role, nom })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('nom')
    set({ token: null, role: null, nom: null })
  }
}))