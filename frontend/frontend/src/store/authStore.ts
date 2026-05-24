import { create } from 'zustand'

interface AuthState {
  token: string | null
  role: string | null
  nom: string | null
  photoUrl: string | null
  setAuth: (token: string, role: string, nom: string) => void
  setPhotoUrl: (url: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  role: localStorage.getItem('role'),
  nom: localStorage.getItem('nom'),
  photoUrl: localStorage.getItem('photoUrl'),

  setAuth: (token, role, nom) => {
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
    localStorage.setItem('nom', nom)
    set({ token, role, nom })
  },

  // ✅ NOUVEAU — Mettre à jour la photo partout
  setPhotoUrl: (url) => {
    if (url) {
      localStorage.setItem('photoUrl', url)
    } else {
      localStorage.removeItem('photoUrl')
    }
    set({ photoUrl: url })
  },

  logout: () => {
    localStorage.clear()
    set({ token: null, role: null, nom: null, photoUrl: null })
    window.location.href = '/login'
  }
}))