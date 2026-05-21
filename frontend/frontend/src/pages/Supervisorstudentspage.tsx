import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Users, Search, X, Check, XCircle,
  FileText, Mail, Phone, MapPin,
  ChevronRight, Loader2,
  UserCheck, Calendar, TrendingUp
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import api from '../services/api'

interface Etudiant {
  id: number
  nom: string
  email: string
  telephone?: string
  ville?: string
  entreprise?: string
  photoUrl?: string
  role: string
}

interface Demande {
  id: number
  statut: 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE'
  message: string
  dateDemande: string
  etudiant?: Etudiant
}

export default function SupervisorStudentsPage() {
  const navigate = useNavigate()
  const isDark = localStorage.getItem('theme') === 'dark'
  const userId = Number(localStorage.getItem('userId'))

  const [etudiants, setEtudiants] = useState<Etudiant[]>([])
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'etudiants' | 'demandes'>('etudiants')
  const [selected, setSelected] = useState<Etudiant | null>(null)

  // ✅ UN SEUL useEffect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        console.log('🔍 Fetching étudiants pour encadrant:', userId)
        const res = await api.get(`/users/encadrant/${userId}/etudiants`)
        console.log('✅ Étudiants reçus:', JSON.stringify(res.data))
        setEtudiants(res.data)
        
        const demRes = await api.get(`/demandes/encadrant/${userId}`)
        setDemandes(demRes.data)
      } catch (error: any) {
        console.error('❌ ERREUR:', error.response?.data || error.message)
        toast.error('Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [userId])

  const goBack = () => navigate('/supervisor')

  const filteredEtudiants = etudiants.filter(e =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  )

  const bg = isDark ? 'bg-gray-950' : 'bg-white'
  const muted = isDark ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className={`min-h-screen ${bg} ${isDark ? 'text-gray-100' : 'text-gray-900'} font-sans`}>
      <Toaster position="top-right" richColors />

      <motion.header
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b backdrop-blur-md ${
          isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-purple-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <button onClick={goBack}
            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-purple-50 text-gray-500'}`}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Users size={18} className="text-purple-600" />
              Mes Étudiants
            </h1>
            <p className={`text-xs ${muted}`}>
              {etudiants.length} étudiant{etudiants.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </motion.header>

      <div className="flex h-[calc(100vh-65px)]">
        <div className={`w-full lg:w-96 flex flex-col border-r ${isDark ? 'border-gray-800' : 'border-purple-100'}`}>
          <div className={`px-3 py-2 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-purple-50 bg-white'}`}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-purple-50'}`}>
              <Search size={14} className={muted} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="flex-1 text-sm bg-transparent outline-none" />
              {search && <button onClick={() => setSearch('')}><X size={13} className={muted} /></button>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-purple-500" />
              </div>
            ) : filteredEtudiants.length === 0 ? (
              <div className={`text-center py-16 ${muted}`}>
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {etudiants.length === 0 ? 'Aucun étudiant trouvé' : 'Aucun résultat'}
                </p>
                {etudiants.length === 0 && (
                  <p className="text-xs mt-1 opacity-60">En attente de demandes d'encadrement</p>
                )}
              </div>
            ) : (
              filteredEtudiants.map((etudiant, i) => (
                <motion.button key={etudiant.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelected(etudiant)}
                  className={`w-full text-left px-4 py-3.5 border-b transition-all ${
                    selected?.id === etudiant.id
                      ? isDark ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'
                      : isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-purple-50 hover:bg-purple-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                      {etudiant.nom.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{etudiant.nom}</p>
                      <p className={`text-xs truncate ${muted}`}>{etudiant.email}</p>
                    </div>
                    <ChevronRight size={15} className={muted} />
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>

        <div className={`flex-1 flex flex-col ${!selected ? 'hidden lg:flex' : 'flex'}`}>
          {!selected ? (
            <div className={`flex-1 flex items-center justify-center ${muted}`}>
              <div className="text-center">
                <Users size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Sélectionnez un étudiant</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className={`px-6 py-5 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-purple-100 bg-white'}`}>
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelected(null)}
                    className={`lg:hidden p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                    <ArrowLeft size={16} />
                  </button>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                    style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                    {selected.nom.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold">{selected.nom}</h2>
                    <p className={`text-xs ${muted}`}>{selected.email}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className={`rounded-2xl border p-5 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-purple-100'}`}>
                  <h3 className="font-semibold text-sm mb-3">Informations</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Mail, val: selected.email, label: 'Email' },
                      { icon: Phone, val: selected.telephone ?? '—', label: 'Téléphone' },
                      { icon: MapPin, val: selected.ville ?? '—', label: 'Ville' },
                      { icon: FileText, val: selected.entreprise ?? '—', label: 'Entreprise' },
                    ].map(({ icon: Icon, val, label }) => (
                      <div key={label} className={`rounded-xl p-3 ${isDark ? 'bg-gray-800' : 'bg-purple-50'}`}>
                        <p className={`text-xs ${muted} mb-0.5`}>{label}</p>
                        <p className="text-sm font-medium truncate flex items-center gap-1.5">
                          <Icon size={12} className="text-purple-500 shrink-0" /> {val}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}