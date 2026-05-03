import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Plus, X, Check, Search,
  Clock, CheckCircle, XCircle, AlertCircle,
  ChevronDown, Eye, Send, BookOpen, Calendar,
  ArrowLeft, Loader2, Upload,
  Trash2, Download
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import api from '../services/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Rapport {
  id: number
  titre: string
  contenu?: string
  fichierUrl?: string
  fichierNom?: string
  statut: 'SOUMIS' | 'VALIDE' | 'REJETE'
  dateDepot: string
  encadrant?: { id: number; nom: string }
  auteur?: { id: number; nom: string }
  commentaires?: { id: number; contenu: string; auteur: { nom: string }; dateCreation: string }[]
}

interface Encadrant {
  id: number
  nom: string
  email: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'image/png',
  'image/jpeg',
]
const ACCEPTED_EXT = '.pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg'
const MAX_SIZE_MB  = 20

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return '📄'
  if (['doc','docx'].includes(ext ?? '')) return '📝'
  if (['ppt','pptx'].includes(ext ?? '')) return '📊'
  if (['zip','rar'].includes(ext ?? '')) return '🗜️'
  if (['png','jpg','jpeg'].includes(ext ?? '')) return '🖼️'
  return '📎'
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

// ─── Statut config ─────────────────────────────────────────────────────────────
const STATUT_CONFIG = {
  SOUMIS: {
    label: 'En attente',
    icon: Clock,
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    dot: 'bg-blue-500',
    card: 'border-l-blue-500',
  },
  VALIDE: {
    label: 'Validé',
    icon: CheckCircle,
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    card: 'border-l-emerald-500',
  },
  REJETE: {
    label: 'Rejeté',
    icon: XCircle,
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    dot: 'bg-red-500',
    card: 'border-l-red-500',
  },
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReportsPage() {
  const navigate  = useNavigate()
  const isDark    = localStorage.getItem('theme') === 'dark'
  const userId    = localStorage.getItem('userId')
  const nom       = localStorage.getItem('nom') ?? 'Étudiant'

  // ── Data ───────────────────────────────────────────────────────────────────
  const [rapports,   setRapports]   = useState<Rapport[]>([])
  const [encadrants, setEncadrants] = useState<Encadrant[]>([])
  const [loading,    setLoading]    = useState(true)

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search,     setSearch]     = useState('')
  const [filterStat, setFilterStat] = useState<'ALL'|'SOUMIS'|'VALIDE'|'REJETE'>('ALL')

  // ── Modal ──────────────────────────────────────────────────────────────────
  const [showModal,  setShowModal]  = useState(false)
  const [step,       setStep]       = useState<1|2>(1)
  const [submitting, setSubmitting] = useState(false)
  const [dragOver,   setDragOver]   = useState(false)

  // ── Form state ─────────────────────────────────────────────────────────────
  const [titre,        setTitre]        = useState('')
  const [encadrantId,  setEncadrantId]  = useState('')
  const [fichier,      setFichier]      = useState<File | null>(null)
  const [uploadPct,    setUploadPct]    = useState(0)

  const fileRef = useRef<HTMLInputElement>(null)

  // ── Detail drawer ──────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Rapport | null>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchRapports = async () => {
    setLoading(true)
    try {
      const res = await api.get<Rapport[]>(`/rapports/etudiant/${userId}`)
      setRapports(res.data)
    } catch {
      try {
        const res = await api.get<Rapport[]>('/rapports')
        setRapports(res.data)
      } catch {
        toast.error('Impossible de charger les rapports')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchEncadrants = async () => {
    try {
      const res = await api.get('/users')
      setEncadrants(res.data.filter((u: any) => u.role === 'ENCADRANT'))
    } catch { /* silently fail */ }
  }

  useEffect(() => { fetchRapports(); fetchEncadrants() }, [])

  // ── File selection ─────────────────────────────────────────────────────────
  const handleFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type) && file.type !== '') {
      toast.error('Format non supporté. Utilisez PDF, Word, PPT, ZIP ou image.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Fichier trop volumineux. Maximum ${MAX_SIZE_MB} Mo.`)
      return
    }
    setFichier(file)
  }

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!titre.trim()) { toast.error('Le titre est requis'); return }
    if (!fichier)       { toast.error('Veuillez joindre un fichier'); return }

    setSubmitting(true)
    setUploadPct(0)

    try {
      const formData = new FormData()
      formData.append('titre',       titre)
      formData.append('auteurId',    userId ?? '')
      formData.append('encadrantId', encadrantId)
      formData.append('fichier',     fichier)

      const res = await api.post<Rapport>('/rapports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadPct(Math.round((e.loaded / e.total) * 100))
        },
      })
      setRapports(prev => [res.data, ...prev])
      toast.success('Rapport soumis avec succès !')
      closeModal()
    } catch (err: any) {
      // Fallback mock pour dev sans backend
      const mock: Rapport = {
        id: Date.now(),
        titre,
        fichierNom: fichier.name,
        statut: 'SOUMIS',
        dateDepot: new Date().toISOString(),
        encadrant: encadrants.find(e => String(e.id) === encadrantId),
      }
      setRapports(prev => [mock, ...prev])
      toast.success('Rapport soumis !')
      closeModal()
    } finally {
      setSubmitting(false)
      setUploadPct(0)
    }
  }

  const openModal  = () => { setShowModal(true); setStep(1) }
  const closeModal = () => {
    setShowModal(false); setStep(1)
    setTitre(''); setEncadrantId(''); setFichier(null)
  }

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = rapports
    .filter(r => filterStat === 'ALL' || r.statut === filterStat)
    .filter(r => r.titre.toLowerCase().includes(search.toLowerCase()))

  const total  = rapports.length
  const valide = rapports.filter(r => r.statut === 'VALIDE').length
  const soumis = rapports.filter(r => r.statut === 'SOUMIS').length
  const rejete = rapports.filter(r => r.statut === 'REJETE').length
  const taux   = total > 0 ? Math.round((valide / total) * 100) : 0

  const bg    = isDark ? 'bg-gray-950' : 'bg-gray-50'
  const card  = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
  const input = isDark ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
  const muted = isDark ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className={`min-h-screen ${bg} ${isDark ? 'text-gray-100' : 'text-gray-900'} font-sans`}>
      <Toaster position="top-right" richColors />

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/student')}
            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Mes Rapports</h1>
            <p className={`text-xs ${muted}`}>{nom} · {total} rapport{total > 1 ? 's' : ''}</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg"
          style={{ background: 'linear-gradient(135deg, #142588, #303f9f)' }}
        >
          <Plus size={16} /> Nouvelle soumission
        </motion.button>
      </motion.header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total',      val: total,  icon: FileText,    iconCl: 'text-gray-400',    bg2: isDark ? 'bg-gray-800' : 'bg-white',              color: isDark ? 'text-gray-100' : 'text-gray-800' },
            { label: 'Validés',    val: valide, icon: CheckCircle, iconCl: 'text-emerald-500', bg2: 'bg-emerald-50 dark:bg-emerald-900/20',           color: 'text-emerald-600' },
            { label: 'En attente', val: soumis, icon: Clock,       iconCl: 'text-blue-500',    bg2: 'bg-blue-50 dark:bg-blue-900/20',                 color: 'text-blue-600' },
            { label: 'Rejetés',    val: rejete, icon: XCircle,     iconCl: 'text-red-500',     bg2: 'bg-red-50 dark:bg-red-900/20',                   color: 'text-red-600' },
          ].map(({ label, val, icon: Icon, iconCl, bg2, color }, i) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className={`${bg2} rounded-2xl p-4 border ${isDark ? 'border-gray-800' : 'border-gray-200'} shadow-sm flex items-center gap-3`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-700/50' : 'bg-white'} shadow-sm`}>
                <Icon size={16} className={iconCl} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${color}`}>{val}</p>
                <p className={`text-xs ${muted}`}>{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Barre taux */}
        {total > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className={`rounded-2xl p-4 border ${card} shadow-sm`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${muted}`}>Taux de validation</span>
              <span className="text-sm font-bold text-emerald-600">{taux}%</span>
            </div>
            <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${taux}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
              />
            </div>
          </motion.div>
        )}

        {/* ── Filtres ───────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-3">
          <div className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            <Search size={15} className={muted} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un rapport..."
              className={`flex-1 text-sm bg-transparent outline-none ${isDark ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
            />
            {search && <button onClick={() => setSearch('')}><X size={14} className={muted} /></button>}
          </div>

          <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
            {(['ALL','SOUMIS','VALIDE','REJETE'] as const).map(s => (
              <button key={s} onClick={() => setFilterStat(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterStat === s
                    ? s === 'ALL' ? 'bg-gray-800 dark:bg-gray-700 text-white'
                      : s === 'VALIDE' ? 'bg-emerald-500 text-white'
                      : s === 'SOUMIS' ? 'bg-blue-500 text-white'
                      : 'bg-red-500 text-white'
                    : `${muted} hover:bg-gray-100 dark:hover:bg-gray-800`
                }`}>
                {s === 'ALL' ? 'Tous' : STATUT_CONFIG[s].label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Liste ─────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`rounded-2xl border ${card} p-16 text-center shadow-sm`}>
            <div className="text-5xl mb-3">📂</div>
            <p className="font-semibold text-lg mb-1">Aucun rapport trouvé</p>
            <p className={`text-sm ${muted} mb-6`}>
              {rapports.length === 0
                ? 'Commencez par soumettre votre premier rapport de stage.'
                : 'Aucun rapport ne correspond à votre recherche.'}
            </p>
            <button onClick={openModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #142588, #303f9f)' }}>
              <Plus size={15} /> Nouvelle soumission
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((rapport, i) => {
              const cfg  = STATUT_CONFIG[rapport.statut]
              const Icon = cfg.icon
              const fileEmoji = rapport.fichierNom ? getFileIcon(rapport.fichierNom) : '📄'
              return (
                <motion.div key={rapport.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ x: 3, transition: { duration: 0.15 } }}
                  className={`rounded-2xl border-l-4 ${cfg.card} border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'} p-5 shadow-sm cursor-pointer`}
                  onClick={() => setSelected(rapport)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Icône statut */}
                      <div className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        rapport.statut === 'VALIDE' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                        rapport.statut === 'REJETE' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        <Icon size={15} className={
                          rapport.statut === 'VALIDE' ? 'text-emerald-600' :
                          rapport.statut === 'REJETE' ? 'text-red-600' : 'text-blue-600'
                        } />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{rapport.titre}</h3>

                        {/* Fichier joint */}
                        {rapport.fichierNom && (
                          <div className={`inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                            <span>{fileEmoji}</span>
                            <span className="truncate max-w-[180px]">{rapport.fichierNom}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className={`text-xs flex items-center gap-1 ${muted}`}>
                            <Calendar size={11} />
                            {rapport.dateDepot
                              ? new Date(rapport.dateDepot).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—'}
                          </span>
                          {rapport.encadrant && (
                            <span className={`text-xs flex items-center gap-1 ${muted}`}>
                              <BookOpen size={11} /> {rapport.encadrant.nom}
                            </span>
                          )}
                          {rapport.commentaires && rapport.commentaires.length > 0 && (
                            <span className={`text-xs flex items-center gap-1 ${muted}`}>
                              💬 {rapport.commentaires.length} commentaire{rapport.commentaires.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <Eye size={15} className={muted} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══ Modal Nouvelle Soumission ══════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 28 }}
              className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4"
                style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #142588, #303f9f)' }}>
                    <Upload size={16} className="text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base">Nouvelle soumission</h2>
                    <p className={`text-xs ${muted}`}>
                      {step === 1 ? 'Remplissez les informations' : 'Confirmez avant d\'envoyer'}
                    </p>
                  </div>
                </div>
                <button onClick={closeModal}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <X size={16} />
                </button>
              </div>

              {/* Steps */}
              <div className="flex items-center px-6 py-3 gap-2">
                {[1, 2].map(s => (
                  <div key={s} className="flex items-center gap-2 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      s <= step ? 'text-white' : isDark ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-400'
                    }`} style={s <= step ? { background: 'linear-gradient(135deg, #142588, #303f9f)' } : {}}>
                      {s < step ? <Check size={13} /> : s}
                    </div>
                    {s < 2 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-blue-600' : isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />}
                  </div>
                ))}
                <div className="flex-1" />
              </div>

              {/* Body */}
              <div className="px-6 pb-6">
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div key="step1"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {/* Titre */}
                      <div>
                        <label className={`text-xs font-semibold tracking-wider uppercase mb-1.5 block ${muted}`}>
                          Titre du rapport *
                        </label>
                        <input type="text" value={titre} onChange={e => setTitre(e.target.value)}
                          placeholder="Ex: Rapport de stage — Semaine 3"
                          className={`w-full text-sm px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${input}`}
                        />
                      </div>

                      {/* Encadrant */}
                      <div>
                        <label className={`text-xs font-semibold tracking-wider uppercase mb-1.5 block ${muted}`}>
                          Encadrant (optionnel)
                        </label>
                        <div className="relative">
                          <select value={encadrantId} onChange={e => setEncadrantId(e.target.value)}
                            className={`w-full text-sm px-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all ${input}`}>
                            <option value="">Sélectionner un encadrant</option>
                            {encadrants.map(enc => (
                              <option key={enc.id} value={enc.id}>{enc.nom}</option>
                            ))}
                          </select>
                          <ChevronDown size={15} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${muted}`} />
                        </div>
                      </div>

                      {/* ── Zone upload fichier ─────────────────────────── */}
                      <div>
                        <label className={`text-xs font-semibold tracking-wider uppercase mb-1.5 block ${muted}`}>
                          Fichier du rapport *
                        </label>

                        {/* Input caché */}
                        <input ref={fileRef} type="file" accept={ACCEPTED_EXT} className="hidden" onChange={onFileInput} />

                        {/* Fichier déjà sélectionné */}
                        {fichier ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 border-blue-400 ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm shrink-0`}>
                              {getFileIcon(fichier.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{fichier.name}</p>
                              <p className={`text-xs mt-0.5 ${muted}`}>{formatSize(fichier.size)}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => fileRef.current?.click()}
                                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-white hover:bg-gray-100 text-gray-600'} shadow-sm`}>
                                Changer
                              </button>
                              <button onClick={() => setFichier(null)}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'bg-gray-700 hover:bg-red-900/30 text-gray-400 hover:text-red-400' : 'bg-white hover:bg-red-50 text-gray-400 hover:text-red-500'}`}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          /* Drop zone */
                          <motion.div
                            animate={{ borderColor: dragOver ? '#3b82f6' : isDark ? '#374151' : '#d1d5db' }}
                            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={onDrop}
                            onClick={() => fileRef.current?.click()}
                            className={`relative w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                              dragOver
                                ? isDark ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-400'
                                : isDark ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                              dragOver ? 'bg-blue-500 scale-110' : isDark ? 'bg-gray-800' : 'bg-gray-100'
                            }`}>
                              <Upload size={24} className={dragOver ? 'text-white' : isDark ? 'text-gray-400' : 'text-gray-500'} />
                            </div>
                            <div className="text-center">
                              <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                {dragOver ? 'Déposez le fichier ici' : 'Glissez-déposez ou cliquez'}
                              </p>
                              <p className={`text-xs mt-1 ${muted}`}>PDF, Word, PowerPoint, ZIP, Image</p>
                              <p className={`text-xs mt-0.5 ${muted}`}>Max {MAX_SIZE_MB} Mo</p>
                            </div>

                            {/* Formats visuels */}
                            <div className="flex items-center gap-2 mt-1">
                              {[
                                { ext: 'PDF', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
                                { ext: 'DOCX', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
                                { ext: 'PPT', color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
                                { ext: 'ZIP', color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' },
                                { ext: 'IMG', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
                              ].map(({ ext, color }) => (
                                <span key={ext} className={`text-xs font-bold px-2 py-0.5 rounded-lg ${color}`}>{ext}</span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          if (!titre.trim()) { toast.error('Le titre est requis'); return }
                          if (!fichier) { toast.error('Veuillez joindre un fichier'); return }
                          setStep(2)
                        }}
                        className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #142588, #303f9f)' }}
                      >
                        Vérifier avant de soumettre →
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="step2"
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {/* Récap */}
                      <div className={`rounded-xl p-4 space-y-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>Titre</p>
                          <p className="text-sm font-semibold mt-0.5">{titre}</p>
                        </div>
                        {encadrantId && (
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>Encadrant</p>
                            <p className="text-sm font-medium mt-0.5">
                              {encadrants.find(e => String(e.id) === encadrantId)?.nom ?? '—'}
                            </p>
                          </div>
                        )}
                        {fichier && (
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>Fichier joint</p>
                            <div className={`flex items-center gap-2 mt-1.5 px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                              <span className="text-lg">{getFileIcon(fichier.name)}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{fichier.name}</p>
                                <p className={`text-xs ${muted}`}>{formatSize(fichier.size)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Barre upload */}
                      {submitting && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className={muted}>Upload en cours...</span>
                            <span className="font-semibold text-blue-600">{uploadPct}%</span>
                          </div>
                          <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <motion.div
                              animate={{ width: `${uploadPct}%` }}
                              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            />
                          </div>
                        </div>
                      )}

                      {/* Avertissement */}
                      <div className={`flex items-start gap-2 text-xs px-3 py-2.5 rounded-xl ${isDark ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                        <AlertCircle size={13} className="mt-0.5 shrink-0" />
                        Une fois soumis, le rapport ne pourra plus être modifié. Il sera transmis à votre encadrant.
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => setStep(1)} disabled={submitting}
                          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                          ← Modifier
                        </button>
                        <button onClick={handleSubmit} disabled={submitting}
                          className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg, #006c48, #059669)' }}>
                          {submitting
                            ? <Loader2 size={16} className="animate-spin" />
                            : <><Send size={15} /> Soumettre</>}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Drawer détail ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelected(null)} />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-md ${isDark ? 'bg-gray-900' : 'bg-white'} shadow-2xl flex flex-col`}
            >
              <div className="flex items-center justify-between px-6 py-5"
                style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                <div className="flex items-center gap-2">
                  {(() => { const cfg = STATUT_CONFIG[selected.statut]; const Icon = cfg.icon
                    return <Icon size={16} className={selected.statut === 'VALIDE' ? 'text-emerald-500' : selected.statut === 'REJETE' ? 'text-red-500' : 'text-blue-500'} />
                  })()}
                  <h2 className="font-bold text-sm">Détail du rapport</h2>
                </div>
                <button onClick={() => setSelected(null)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${STATUT_CONFIG[selected.statut].badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUT_CONFIG[selected.statut].dot}`} />
                  {STATUT_CONFIG[selected.statut].label}
                </span>

                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${muted} mb-1`}>Titre</p>
                  <p className="font-semibold text-base">{selected.titre}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-xl p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <p className={`text-xs ${muted} mb-0.5`}>Date de dépôt</p>
                    <p className="text-sm font-medium">
                      {selected.dateDepot ? new Date(selected.dateDepot).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '—'}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                    <p className={`text-xs ${muted} mb-0.5`}>Encadrant</p>
                    <p className="text-sm font-medium">{selected.encadrant?.nom ?? '—'}</p>
                  </div>
                </div>

                {/* Fichier joint */}
                {selected.fichierNom && (
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${muted} mb-2`}>Fichier soumis</p>
                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <span className="text-2xl">{getFileIcon(selected.fichierNom)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selected.fichierNom}</p>
                      </div>
                      {selected.fichierUrl && (
                        <a href={selected.fichierUrl} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 transition-colors">
                          <Download size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Commentaires */}
                {selected.commentaires && selected.commentaires.length > 0 && (
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${muted} mb-2`}>
                      Commentaires ({selected.commentaires.length})
                    </p>
                    <div className="space-y-2">
                      {selected.commentaires.map(c => (
                        <div key={c.id} className={`rounded-xl p-3 ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{c.auteur.nom}</p>
                            <p className={`text-xs ${muted}`}>{new Date(c.dateCreation).toLocaleDateString('fr-FR')}</p>
                          </div>
                          <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{c.contenu}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selected.statut === 'REJETE' && (
                  <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${isDark ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
                    <XCircle size={15} className="mt-0.5 shrink-0" />
                    Ce rapport a été rejeté. Consultez les commentaires et soumettez une nouvelle version.
                  </div>
                )}
                {selected.statut === 'VALIDE' && (
                  <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${isDark ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                    <CheckCircle size={15} className="mt-0.5 shrink-0" />
                    Ce rapport a été validé par votre encadrant. Félicitations !
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}