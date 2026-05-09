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

// ─── Types ────────────────────────────────────────────────────────────────────
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

interface Rapport {
  id: number
  titre: string
  statut: 'SOUMIS' | 'VALIDE' | 'REJETE'
  dateDepot: string
  auteur?: { id: number }
}

interface Demande {
  id: number
  statut: 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE'
  message: string
  dateDemande: string
  etudiant?: Etudiant
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SupervisorStudentsPage() {
  const navigate  = useNavigate()
  const isDark    = localStorage.getItem('theme') === 'dark'
  const userId    = localStorage.getItem('userId')

  // ── Data ───────────────────────────────────────────────────────────────────
  const [etudiants,  setEtudiants]  = useState<Etudiant[]>([])
  const [rapports,   setRapports]   = useState<Rapport[]>([])
  const [demandes,   setDemandes]   = useState<Demande[]>([])
  const [loading,    setLoading]    = useState(true)

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [search,     setSearch]     = useState('')
  const [activeTab,  setActiveTab]  = useState<'etudiants' | 'demandes'>('etudiants')
  const [selected,   setSelected]   = useState<Etudiant | null>(null)
  const [loadingAct, setLoadingAct] = useState<number | null>(null)
  const [filterDem,  setFilterDem]  = useState<'ALL' | 'EN_ATTENTE' | 'ACCEPTE' | 'REFUSE'>('ALL')

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, rapportsRes] = await Promise.all([
        api.get('/users'),
        api.get('/rapports'),
      ])
      // Filtrer seulement les étudiants
      setEtudiants(usersRes.data.filter((u: any) => u.role === 'ETUDIANT'))
      setRapports(rapportsRes.data)

      if (userId) {
        const demandesRes = await api.get(`/demandes/encadrant/${userId}`)
        setDemandes(demandesRes.data)
      }
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // ── Répondre à une demande ─────────────────────────────────────────────────
  const handleRepondre = async (demandeId: number, accepte: boolean) => {
    setLoadingAct(demandeId)
    try {
      await api.put(`/demandes/${demandeId}/repondre`, { accepte })
      setDemandes(prev => prev.map(d =>
        d.id === demandeId
          ? { ...d, statut: accepte ? 'ACCEPTE' : 'REFUSE' }
          : d
      ))
      toast.success(accepte ? '✅ Demande acceptée !' : '❌ Demande refusée')
    } catch {
      toast.error('Erreur lors de la réponse')
    } finally {
      setLoadingAct(null)
    }
  }

  // ── Navigate back ──────────────────────────────────────────────────────────
  const goBack = () => navigate('/supervisor')

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filteredEtudiants = etudiants.filter(e =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  )

  const filteredDemandes = demandes
    .filter(d => filterDem === 'ALL' || d.statut === filterDem)
    .filter(d =>
      (d.etudiant?.nom ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (d.etudiant?.email ?? '').toLowerCase().includes(search.toLowerCase())
    )

  // ── Stats ──────────────────────────────────────────────────────────────────
  const demandesEnAttente = demandes.filter(d => d.statut === 'EN_ATTENTE').length
  const demandesAcceptees = demandes.filter(d => d.statut === 'ACCEPTE').length

  // Rapports d'un étudiant sélectionné
  const etudiantRapports = selected
    ? rapports.filter(r => r.auteur?.id === selected.id)
    : []

  const etudiantStats = (etudiantId: number) => {
    const raps = rapports.filter(r => r.auteur?.id === etudiantId)
    const val  = raps.filter(r => r.statut === 'VALIDE').length
    return {
      total:    raps.length,
      valide:   val,
      soumis:   raps.filter(r => r.statut === 'SOUMIS').length,
      progress: raps.length > 0 ? Math.round((val / raps.length) * 100) : 0,
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const bg    = isDark ? 'bg-gray-950' : 'bg-white'
  const card  = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-purple-100'
  const muted = isDark ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className={`min-h-screen ${bg} ${isDark ? 'text-gray-100' : 'text-gray-900'} font-sans`}>
      <Toaster position="top-right" richColors />

      {/* ── Topbar ────────────────────────────────────────────────────────── */}
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
              {etudiants.length} étudiant{etudiants.length > 1 ? 's' : ''} ·{' '}
              {demandesEnAttente > 0 && (
                <span className="text-amber-500 font-semibold">{demandesEnAttente} demande{demandesEnAttente > 1 ? 's' : ''} en attente</span>
              )}
            </p>
          </div>
        </div>
      </motion.header>

      <div className="flex h-[calc(100vh-65px)]">

        {/* ══ Colonne gauche — Liste ═══════════════════════════════════════════ */}
        <div className={`w-full lg:w-96 flex flex-col border-r ${isDark ? 'border-gray-800' : 'border-purple-100'} ${selected ? 'hidden lg:flex' : 'flex'}`}>

          {/* Stats rapides */}
          <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-purple-50 bg-white'}`}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Étudiants',  val: etudiants.length,  color: 'text-purple-600' },
                { label: 'En attente', val: demandesEnAttente, color: 'text-amber-600' },
                { label: 'Acceptées',  val: demandesAcceptees, color: 'text-emerald-600' },
              ].map(({ label, val, color }) => (
                <div key={label} className={`text-center p-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-purple-50'}`}>
                  <p className={`text-lg font-bold ${color}`}>{val}</p>
                  <p className={`text-xs ${muted}`}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex gap-1 p-2 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-purple-50 bg-white'}`}>
            {([
              { key: 'etudiants', label: 'Étudiants', count: etudiants.length },
              { key: 'demandes',  label: 'Demandes',  count: demandes.length,  badge: demandesEnAttente },
            ] as const).map(({ key, label, count, badge }: any) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === key
                    ? 'text-white'
                    : `${muted} ${isDark ? 'hover:bg-gray-800' : 'hover:bg-purple-50'}`
                }`}
                style={activeTab === key ? { background: 'linear-gradient(135deg, #421384, #6d28d9)' } : {}}
              >
                {label}
                <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold ${
                  activeTab === key ? 'bg-white/20' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-purple-100 text-purple-700'
                }`}>{count}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">{badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className={`px-3 py-2 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-purple-50 bg-white'}`}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-purple-50'}`}>
              <Search size={14} className={muted} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="flex-1 text-sm bg-transparent outline-none" />
              {search && <button onClick={() => setSearch('')}><X size={13} className={muted} /></button>}
            </div>

            {/* Filtre demandes */}
            {activeTab === 'demandes' && (
              <div className="flex gap-1 mt-2">
                {(['ALL', 'EN_ATTENTE', 'ACCEPTE', 'REFUSE'] as const).map(f => (
                  <button key={f} onClick={() => setFilterDem(f)}
                    className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${
                      filterDem === f
                        ? f === 'EN_ATTENTE' ? 'bg-amber-500 text-white'
                          : f === 'ACCEPTE' ? 'bg-emerald-500 text-white'
                          : f === 'REFUSE'  ? 'bg-red-500 text-white'
                          : 'text-white'
                        : `${muted} ${isDark ? 'hover:bg-gray-800' : 'hover:bg-purple-50'}`
                    }`}
                    style={filterDem === f && f === 'ALL' ? { background: 'linear-gradient(135deg, #421384, #6d28d9)' } : {}}
                  >
                    {f === 'ALL' ? 'Tous' : f === 'EN_ATTENTE' ? 'Attente' : f === 'ACCEPTE' ? 'Acc.' : 'Ref.'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-purple-500" />
              </div>

            ) : activeTab === 'etudiants' ? (
              filteredEtudiants.length === 0 ? (
                <div className={`text-center py-16 ${muted}`}>
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucun étudiant trouvé</p>
                </div>
              ) : (
                filteredEtudiants.map((etudiant, i) => {
                  const stats = etudiantStats(etudiant.id)
                  return (
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
                        {/* Avatar */}
                        {etudiant.photoUrl ? (
                          <img src={etudiant.photoUrl} alt={etudiant.nom}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-purple-100 dark:ring-purple-900 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                            style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                            {etudiant.nom.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{etudiant.nom}</p>
                          <p className={`text-xs truncate ${muted}`}>{etudiant.email}</p>
                          {/* Progress bar */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className={`flex-1 h-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-purple-100'}`}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.progress}%` }}
                                transition={{ delay: i * 0.04 + 0.2, duration: 0.6 }}
                                className="h-full rounded-full"
                                style={{ background: 'linear-gradient(90deg, #421384, #6d28d9)' }}
                              />
                            </div>
                            <span className={`text-xs font-semibold shrink-0 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                              {stats.progress}%
                            </span>
                          </div>
                        </div>

                        <ChevronRight size={15} className={muted} />
                      </div>
                    </motion.button>
                  )
                })
              )
            ) : (
              // ── Tab Demandes ──────────────────────────────────────────────
              filteredDemandes.length === 0 ? (
                <div className={`text-center py-16 ${muted}`}>
                  <UserCheck size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aucune demande</p>
                </div>
              ) : (
                filteredDemandes.map((demande, i) => (
                  <motion.div key={demande.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`px-4 py-4 border-b ${isDark ? 'border-gray-800' : 'border-purple-50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg, #142588, #303f9f)' }}>
                        {demande.etudiant?.nom?.charAt(0) ?? '?'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold truncate">{demande.etudiant?.nom ?? '—'}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                            demande.statut === 'ACCEPTE'   ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : demande.statut === 'REFUSE'  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {demande.statut === 'ACCEPTE' ? '✓ Acceptée' : demande.statut === 'REFUSE' ? '✕ Refusée' : '⏳ Attente'}
                          </span>
                        </div>

                        <p className={`text-xs ${muted} mb-1`}>{demande.etudiant?.email}</p>

                        {demande.message && (
                          <p className={`text-xs italic px-2 py-1.5 rounded-lg mb-2 line-clamp-2 ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-purple-50 text-gray-600'}`}>
                            "{demande.message}"
                          </p>
                        )}

                        <p className={`text-xs flex items-center gap-1 mb-2 ${muted}`}>
                          <Calendar size={10} />
                          {new Date(demande.dateDemande).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                        </p>

                        {/* Actions si EN_ATTENTE */}
                        {demande.statut === 'EN_ATTENTE' && (
                          <div className="flex gap-2">
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                              onClick={() => handleRepondre(demande.id, true)}
                              disabled={loadingAct === demande.id}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-60"
                              style={{ background: 'linear-gradient(135deg, #006c48, #059669)' }}>
                              {loadingAct === demande.id
                                ? <Loader2 size={12} className="animate-spin" />
                                : <><Check size={12} /> Accepter</>}
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                              onClick={() => handleRepondre(demande.id, false)}
                              disabled={loadingAct === demande.id}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-xs font-semibold disabled:opacity-60 bg-red-600 hover:bg-red-700">
                              <XCircle size={12} /> Refuser
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )
            )}
          </div>
        </div>

        {/* ══ Colonne droite — Détail étudiant ════════════════════════════════ */}
        <div className={`flex-1 flex flex-col ${!selected ? 'hidden lg:flex' : 'flex'}`}>
          {!selected ? (
            <div className={`flex-1 flex items-center justify-center ${muted}`}>
              <div className="text-center">
                <Users size={48} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Sélectionnez un étudiant</p>
                <p className="text-xs mt-1 opacity-60">pour voir son profil et ses rapports</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={selected.id}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Header détail */}
                <div className={`px-6 py-5 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-purple-100 bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button onClick={() => setSelected(null)}
                        className={`lg:hidden p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                        <ArrowLeft size={16} />
                      </button>

                      {selected.photoUrl ? (
                        <img src={selected.photoUrl} alt={selected.nom}
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-200 dark:ring-purple-800" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                          style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                          {selected.nom.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <h2 className="font-bold">{selected.nom}</h2>
                        <p className={`text-xs ${muted}`}>{selected.email}</p>
                      </div>
                    </div>

                    <a href={`mailto:${selected.email}`}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                      style={{ background: 'rgba(66,19,132,0.1)', color: '#421384' }}>
                      <Mail size={12} /> Contacter
                    </a>
                  </div>
                </div>

                {/* Corps */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                  {/* Infos */}
                  <div className={`rounded-2xl border ${card} p-5`}>
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Users size={14} className="text-purple-500" /> Informations
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Mail,    val: selected.email,      label: 'Email' },
                        { icon: Phone,   val: selected.telephone ?? '—', label: 'Téléphone' },
                        { icon: MapPin,  val: selected.ville ?? '—',     label: 'Ville' },
                        { icon: FileText,val: selected.entreprise ?? '—',label: 'Entreprise' },
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

                  {/* Stats rapports */}
                  {(() => {
                    const stats = etudiantStats(selected.id)
                    return (
                      <div className={`rounded-2xl border ${card} p-5`}>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <TrendingUp size={14} className="text-purple-500" /> Progression
                        </h3>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {[
                            { label: 'Total',     val: stats.total,  color: isDark ? 'text-gray-100' : 'text-gray-800' },
                            { label: 'Validés',   val: stats.valide, color: 'text-emerald-600' },
                            { label: 'En attente',val: stats.soumis, color: 'text-amber-600' },
                          ].map(({ label, val, color }) => (
                            <div key={label} className={`text-center p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-purple-50'}`}>
                              <p className={`text-xl font-bold ${color}`}>{val}</p>
                              <p className={`text-xs ${muted}`}>{label}</p>
                            </div>
                          ))}
                        </div>
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className={muted}>Taux de validation</span>
                            <span className="font-bold text-purple-600">{stats.progress}%</span>
                          </div>
                          <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-purple-100'}`}>
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${stats.progress}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-2 rounded-full"
                              style={{ background: 'linear-gradient(90deg, #421384, #6d28d9)' }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Rapports */}
                  <div className={`rounded-2xl border ${card} p-5`}>
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <FileText size={14} className="text-purple-500" />
                      Rapports soumis ({etudiantRapports.length})
                    </h3>

                    {etudiantRapports.length === 0 ? (
                      <div className={`text-center py-8 ${muted}`}>
                        <FileText size={28} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Aucun rapport soumis</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {etudiantRapports.map((r, i) => (
                          <motion.div key={r.id}
                            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className={`flex items-center justify-between p-3 rounded-xl border-l-4 ${
                              r.statut === 'VALIDE'  ? 'border-l-emerald-500' :
                              r.statut === 'REJETE'  ? 'border-l-red-500' : 'border-l-amber-500'
                            } ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-purple-50 border-purple-100'}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{r.titre}</p>
                              <p className={`text-xs mt-0.5 ${muted}`}>
                                {r.dateDepot ? new Date(r.dateDepot).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                              </p>
                            </div>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ml-2 ${
                              r.statut === 'VALIDE'  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : r.statut === 'REJETE' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {r.statut === 'VALIDE' ? '✓ Validé' : r.statut === 'REJETE' ? '✕ Rejeté' : '⏳ Soumis'}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  )
}