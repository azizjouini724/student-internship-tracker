import api from './api'
import { useAuthStore } from '../store/authStore'

// ── Fonction pour charger photo + infos après login ────────────────────────
const fetchAndSaveUserProfile = async (userId: string, token: string) => {
  try {
    const response = await api.get(`/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const user = response.data;
    
    // ✅ Sauvegarder dans le localStorage
    if (user.photoUrl) localStorage.setItem("photoUrl", user.photoUrl);
    if (user.telephone) localStorage.setItem("telephone", user.telephone);
    if (user.ville) localStorage.setItem("ville", user.ville);
    if (user.entreprise) localStorage.setItem("entreprise", user.entreprise);
    
    // ✅ NOUVEAU — Mettre à jour le store Zustand pour tous les composants
    const store = useAuthStore.getState()
    if (user.photoUrl) store.setPhotoUrl(user.photoUrl)

  } catch (error) {
    console.error("Erreur chargement profil après login:", error);
  }
};

export const authService = {

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const data = response.data

    localStorage.setItem('token',  data.token)
    localStorage.setItem('role',   data.role)
    localStorage.setItem('nom',    data.nom)
    localStorage.setItem('userId', String(data.id))

    // ✅ Mettre à jour le store Zustand
    const store = useAuthStore.getState()
    store.setAuth(data.token, data.role, data.nom)

    // ✅ Charger la photo et les infos
    await fetchAndSaveUserProfile(String(data.id), data.token)

    return data
  },

  register: async (nom: string, email: string, password: string, role: string) => {
    const response = await api.post('/auth/register', { nom, email, password, role })
    const data = response.data

    localStorage.setItem('token',  data.token)
    localStorage.setItem('role',   data.role)
    localStorage.setItem('nom',    data.nom)
    localStorage.setItem('userId', String(data.id))

    const store = useAuthStore.getState()
    store.setAuth(data.token, data.role, data.nom)

    await fetchAndSaveUserProfile(String(data.id), data.token)

    return data
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('nom')
    localStorage.removeItem('userId')
    localStorage.removeItem('photoUrl')
    localStorage.removeItem('telephone')
    localStorage.removeItem('ville')
    localStorage.removeItem('entreprise')
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token')
  }
}