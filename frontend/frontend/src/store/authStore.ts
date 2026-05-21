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

  // ✅ FIX : Force le redirect + vide TOUT le localStorage
  logout: () => {
    localStorage.clear() // Vide TOUT au lieu de removeItem un par un
    set({ token: null, role: null, nom: null })
    
    // Force le reload pour vider le cache du router
    window.location.href = '/login'
  }
}))