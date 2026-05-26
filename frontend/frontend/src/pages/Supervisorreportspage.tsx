import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, FileText, Search, X, Check, XCircle,
  Clock, Star, Download, MessageSquare, Eye,
  Filter, Loader2, ChevronRight, Send, AlertCircle,
  CheckCircle2, Award, BarChart3, User, Calendar,
  FileDown, ThumbsUp, ThumbsDown, CalendarDays
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import api from '../services/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Rapport {
  id: number
  titre: string
  contenu?: string
  fichierNom?: string
  fichierChemin?: string
  fichierType?: string
  fichierTaille?: number
  fichierUrl?: string
  statut: 'SOUMIS' | 'VALIDE' | 'REJETE'
  dateDepot: string
  score?: number
  deadlineId?: number | null // ⭐ AJOUTÉ
  auteur?: { id: number; nom: string; email: string }
  encadrant?: { id: number; nom: string }
  commentaires?: Commentaire[]
}

interface Commentaire {
  id: number
  contenu: string
  dateCreation: string
  auteur?: { id: number; nom: string }
}

// ⭐ AJOUTÉ : Interface Deadline
interface Deadline {
  id: number
  type?: string
  titre?: string
  dateLimite?: string
  dateEcheance?: string
}

// ─── Statut config ────────────────────────────────────────────────────────────
const STATUT = {
  SOUMIS:  { label: 'En attente', icon: Clock,       badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',     border: 'border-l-amber-500',   dot: 'bg-amber-500' },
  VALIDE:  { label: 'Validé',     icon: CheckCircle2, badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', border: 'border-l-emerald-500', dot: 'bg-emerald-500' },
  REJETE:  { label: 'Rejeté',     icon: XCircle,      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',             border: 'border-l-red-500',     dot: 'bg-red-500' },
}

// ─── Format taille fichier ──────────────────────────────────────────────────
const formatFileSize = (bytes?: number) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' o'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko'
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
}

// ─── Score Stars ─────────────────────────────────────────────────────────────
function ScoreStars({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`transition-all ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star size={18} className={`transition-colors ${
            n <= (hover || value)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-300 dark:text-gray-600'
          }`} />
        </button>
      ))}
      {value > 0 && <span className="ml-1.5 text-xs font-bold text-amber-500">{value}/5</span>}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SupervisorReportsPage() {
  const navigate   = useNavigate()
  const isDark     = localStorage.getItem('theme') === 'dark'
  const userId     = localStorage.getItem('userId')
  const supervisorNom = localStorage.getItem('nom') ?? 'Encadrant'

  // ── Data ─────────────────────────────────────────────────────────────────
  const [rapports,  setRapports]  = useState<Rapport[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([]) // ⭐ AJOUTÉ
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState<Rapport | null>(null)

  // ── Filters ──────────────────────────────────────────────────────────────
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState<'ALL' | 'SOUMIS' | 'VALIDE' | 'REJETE'>('ALL')

  // ── Actions ──────────────────────────────────────────────────────────────
  const [validating,  setValidating]  = useState(false)
  const [score,       setScore]       = useState(0)
  const [comment,     setComment]     = useState('')
  const [sendingCom,  setSendingCom]  = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  // ⭐ Helper pour trouver la deadline par ID
  const getDeadline = (deadlineId?: number | null) => {
    if (!deadlineId) return null
    return deadlines.find(d => d.id === deadlineId)
  }

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchRapports = async () => {
    setLoading(true)
    try {
      if (userId) {
        const res = await api.get<Rapport[]>(`/rapports/encadrant/${userId}`)
        setRapports(res.data)
      } else {
        const res = await api.get<Rapport[]>('/rapports')
        setRapports(res.data)
      }
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  // ⭐ Fetch deadlines de l'encadrant
  const fetchDeadlines = async () => {
    try {
      if (userId) {
        const res = await api.get<Deadline[]>(`/deadlines/encadrant/${userId}`)
        setDeadlines(res.data)
      }
    } catch {
      console.error('Erreur chargement deadlines')
    }
  }

  useEffect(() => { 
    fetchRapports()
    fetchDeadlines() // ⭐ AJOUTÉ
  }, [])

  // ── Ouvrir un rapport ────────────────────────────────────────────────────
  const openRapport = async (r: Rapport) => {
    setSelected(r)
    setScore(r.score ?? 0)
    setComment('')
    try {
      const res = await api.get(`/commentaires/rapport/${r.id}`)
      setSelected({ ...r, commentaires: res.data })
    } catch {
      setSelected(r)
    }
  }

  // ── Valider / Rejeter ────────────────────────────────────────────────────
  const handleValider = async (statut: 'VALIDE' | 'REJETE') => {
    if (!selected) return
    setValidating(true)
    try {
      await api.put(`/rapports/${selected.id}/valider`, { statut })
      if (score > 0) {
        try { await api.put(`/rapports/${selected.id}/score`, { score }) } catch {}
      }
      const updated = { ...selected, statut, score }
      setRapports(prev => prev.map(r => r.id === selected.id ? updated : r))
      setSelected(updated)
      toast.success(statut === 'VALIDE' ? '✅ Rapport validé !' : '❌ Rapport rejeté')
    } catch {
      toast.error('Erreur lors de la validation')
    } finally {
      setValidating(false)
    }
  }

  // ── Envoyer commentaire ──────────────────────────────────────────────────
  const handleSendComment = async () => {
    if (!selected || !comment.trim()) { toast.error('Écrivez un commentaire'); return }
    setSendingCom(true)
    try {
      const res = await api.post<Commentaire>('/commentaires', {
        contenu:   comment,
        rapportId: selected.id,
        auteurId:  userId,
      })
      const updated = {
        ...selected,
        commentaires: [...(selected.commentaires ?? []), res.data],
      }
      setRapports(prev => prev.map(r => r.id === selected.id ? updated : r))
      setSelected(updated)
      setComment('')
      toast.success('Commentaire envoyé !')
    } catch {
      const mock: Commentaire = {
        id: Date.now(),
        contenu: comment,
        dateCreation: new Date().toISOString(),
        auteur: { id: Number(userId), nom: supervisorNom },
      }
      const updated = {
        ...selected,
        commentaires: [...(selected.commentaires ?? []), mock],
      }
      setRapports(prev => prev.map(r => r.id === selected.id ? updated : r))
      setSelected(updated)
      setComment('')
      toast.success('Commentaire ajouté !')
    } finally {
      setSendingCom(false)
    }
  }

  // ── Télécharger le fichier ───────────────────────────────────────────────
  const handleDownload = async (rapportId: number, fileName: string) => {
    setDownloadingId(rapportId)
    try {
      const response = await api.get(`/rapports/${rapportId}/fichier`, {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName || 'rapport.pdf')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Fichier téléchargé !')
    } catch {
      toast.error('Erreur lors du téléchargement')
    } finally {
      setDownloadingId(null)
    }
  }

  // ── Export ───────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!selected) return
    if (selected.fichierNom) {
      handleDownload(selected.id, selected.fichierNom)
      return
    }
    const content = [
      `RAPPORT : ${selected.titre}`,
      `Étudiant : ${selected.auteur?.nom ?? '—'}`,
      `Date : ${new Date(selected.dateDepot).toLocaleDateString('fr-FR')}`,
      `Statut : ${STATUT[selected.statut].label}`,
      `Score : ${selected.score ?? 'Non noté'}/5`,
      `\n${selected.contenu ?? ''}`,
    ].join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `rapport_${selected.titre.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Rapport exporté !')
  }

  const goBack = () => navigate('/supervisor')

  // ── Filtered ─────────────────────────────────────────────────────────────
  const filtered = rapports
    .filter(r => filter === 'ALL' || r.statut === filter)
    .filter(r =>
      r.titre.toLowerCase().includes(search.toLowerCase()) ||
      (r.auteur?.nom ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.dateDepot).getTime() - new Date(a.dateDepot).getTime())

  const total   = rapports.length
  const soumis  = rapports.filter(r => r.statut === 'SOUMIS').length
  const valides = rapports.filter(r => r.statut === 'VALIDE').length
  const rejetes = rapports.filter(r => r.statut === 'REJETE').length

  // ── Styles ───────────────────────────────────────────────────────────────
  const bg    = isDark ? 'bg-gray-950' : 'bg-white'
  const card  = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-purple-100'
  const input = isDark
    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500'
    : 'bg-white border-purple-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'
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
              <FileText size={18} className="text-purple-600" />
              Rapports des Étudiants
            </h1>
            <p className={`text-xs ${muted}`}>{total} rapport{total > 1 ? 's' : ''} · {soumis} en attente</p>
          </div>
        </div>
        {soumis > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
            <Clock size={13} /> {soumis} à valider
          </span>
        )}
      </motion.header>

      <div className="flex h-[calc(100vh-65px)]">

        {/* ══ Colonne gauche — Liste ══════════════════════════════════════════ */}
        <div className={`w-full lg:w-96 flex flex-col border-r ${isDark ? 'border-gray-800' : 'border-purple-100'} ${selected ? 'hidden lg:flex' : 'flex'}`}>

          {/* Stats */}
          <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-purple-50 bg-white'}`}>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Total',     val: total,   color: isDark ? 'text-gray-100' : 'text-gray-800' },
                { label: 'Attente',   val: soumis,  color: 'text-amber-600' },
                { label: 'Validés',   val: valides, color: 'text-emerald-600' },
                { label: 'Rejetés',   val: rejetes, color: 'text-red-500' },
              ].map(({ label, val, color }) => (
                <div key={label} className={`text-center p-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-purple-50'}`}>
                  <p className={`text-base font-bold ${color}`}>{val}</p>
                  <p className={`text-xs ${muted}`}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Search + filtres */}
          <div className={`p-3 space-y-2 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-purple-50 bg-white'}`}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-purple-50 border-transparent'}`}>
              <Search size={14} className={muted} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un rapport..."
                className="flex-1 text-sm bg-transparent outline-none" />
              {search && <button onClick={() => setSearch('')}><X size={13} className={muted} /></button>}
            </div>
            <div className="flex gap-1">
              {(['ALL', 'SOUMIS', 'VALIDE', 'REJETE'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === f
                      ? f === 'ALL'    ? 'text-white'
                        : f === 'VALIDE' ? 'bg-emerald-500 text-white'
                        : f === 'SOUMIS' ? 'bg-amber-500 text-white'
                        : 'bg-red-500 text-white'
                      : `${muted} ${isDark ? 'hover:bg-gray-800' : 'hover:bg-purple-50'}`
                  }`}
                  style={filter === f && f === 'ALL' ? { background: 'linear-gradient(135deg, #421384, #6d28d9)' } : {}}
                >
                  {f === 'ALL' ? 'Tous' : f === 'VALIDE' ? 'Validés' : f === 'SOUMIS' ? 'Attente' : 'Rejetés'}
                </button>
              ))}
            </div>
          </div>

          {/* Liste rapports */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-purple-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className={`text-center py-16 ${muted}`}>
                <FileText size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun rapport trouvé</p>
              </div>
            ) : (
              filtered.map((rapport, i) => {
                const cfg = STATUT[rapport.statut]
                const dl = getDeadline(rapport.deadlineId) // ⭐ Trouver la deadline
                return (
                  <motion.button key={rapport.id}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => openRapport(rapport)}
                    className={`w-full text-left px-4 py-3.5 border-b border-l-4 transition-all ${cfg.border} ${
                      selected?.id === rapport.id
                        ? isDark ? 'bg-purple-900/20 border-r-0' : 'bg-purple-50'
                        : isDark ? 'border-b-gray-800 hover:bg-gray-800/50' : 'border-b-purple-50 hover:bg-purple-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center mt-0.5 ${
                        rapport.statut === 'SOUMIS'  ? 'bg-amber-100 dark:bg-amber-900/30' :
                        rapport.statut === 'VALIDE'  ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                                       'bg-red-100 dark:bg-red-900/30'
                      }`}>
                        <cfg.icon size={14} className={
                          rapport.statut === 'SOUMIS'  ? 'text-amber-600' :
                          rapport.statut === 'VALIDE'  ? 'text-emerald-600' : 'text-red-600'
                        } />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{rapport.titre}</p>
                        <p className={`text-xs truncate ${muted}`}>{rapport.auteur?.nom ?? '—'}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs ${muted}`}>
                            {new Date(rapport.dateDepot).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                          {rapport.fichierNom && (
                            <span className="text-xs text-purple-500">📎 {rapport.fichierNom.split('.').pop()?.toUpperCase()}</span>
                          )}
                          {rapport.fichierTaille ? (
                            <span className={`text-xs ${muted}`}>{formatFileSize(rapport.fichierTaille)}</span>
                          ) : null}
                          {rapport.score && rapport.score > 0 && (
                            <span className="text-xs text-amber-500 font-bold">⭐ {rapport.score}/5</span>
                          )}
                          {/* ⭐ Deadline associée dans la liste */}
                          {dl && (
                            <span className="text-xs text-purple-500 dark:text-purple-400 flex items-center gap-0.5">
                              <CalendarDays size={10} className="shrink-0" />
                              {dl.type || dl.titre}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                        {(rapport.commentaires?.length ?? 0) > 0 && (
                          <span className={`text-xs flex items-center gap-0.5 ${muted}`}>
                            <MessageSquare size={10} /> {rapport.commentaires?.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                )
              })
            )}
          </div>
        </div>

        {/* ══ Colonne droite — Détail ════════════════════════════════════════ */}
        <div className={`flex-1 flex flex-col overflow-hidden ${!selected ? 'hidden lg:flex' : 'flex'}`}>
          {!selected ? (
            <div className={`flex-1 flex items-center justify-center ${muted}`}>
              <div className="text-center">
                <FileText size={48} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">Sélectionnez un rapport</p>
                <p className="text-xs mt-1 opacity-60">pour le valider, noter et commenter</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={selected.id}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className={`px-6 py-4 border-b flex items-center justify-between ${isDark ? 'border-gray-800 bg-gray-900' : 'border-purple-100 bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelected(null)}
                      className={`lg:hidden p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <h2 className="font-bold text-sm truncate max-w-xs">{selected.titre}</h2>
                      <p className={`text-xs ${muted}`}>
                        {selected.auteur?.nom ?? '—'} ·{' '}
                        {new Date(selected.dateDepot).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleExport} disabled={downloadingId === selected.id}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 ${
                        isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
                      }`}>
                      {downloadingId === selected.id
                        ? <Loader2 size={13} className="animate-spin" />
                        : <FileDown size={13} />}
                      {selected.fichierNom ? 'Télécharger' : 'Exporter'}
                    </button>
                    <span className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 ${STATUT[selected.statut].badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUT[selected.statut].dot}`} />
                      {STATUT[selected.statut].label}
                    </span>
                  </div>
                </div>

                {/* Corps scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                  {/* Infos étudiant */}
                  <div className={`rounded-2xl border ${card} p-4 flex items-center gap-3`}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                      {selected.auteur?.nom?.charAt(0) ?? '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{selected.auteur?.nom ?? '—'}</p>
                      <p className={`text-xs ${muted}`}>{selected.auteur?.email ?? '—'}</p>
                    </div>
                    {selected.auteur?.email && (
                      <a href={`mailto:${selected.auteur.email}`}
                        className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-purple-400' : 'bg-purple-50 hover:bg-purple-100 text-purple-700'}`}>
                        Contacter
                      </a>
                    )}
                  </div>

                  {/* ⭐ Deadline associée (carte dédiée) */}
                  {selected.deadlineId && getDeadline(selected.deadlineId) && (() => {
                    const dl = getDeadline(selected.deadlineId)!
                    return (
                      <div className={`rounded-2xl border ${card} p-4 flex items-center gap-3`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                          <CalendarDays size={18} className="text-purple-500" />
                        </div>
                        <div className="flex-1">
                          <p className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>Deadline associée</p>
                          <p className="text-sm font-semibold">{dl.type || dl.titre}</p>
                          <p className={`text-xs ${muted}`}>
                            {dl.dateLimite 
                              ? `📅 ${new Date(dl.dateLimite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` 
                              : '—'}
                          </p>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Fichier joint */}
                  {selected.fichierNom && (
                    <div className={`rounded-2xl border ${card} p-4`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                          selected.fichierType?.includes('pdf') ? 'bg-red-100 dark:bg-red-900/30' :
                          selected.fichierType?.includes('word') || selected.fichierType?.includes('document') ? 'bg-blue-100 dark:bg-blue-900/30' :
                          'bg-purple-100 dark:bg-purple-900/30'
                        }`}>
                          {selected.fichierType?.includes('pdf') ? '📕' :
                           selected.fichierType?.includes('word') || selected.fichierType?.includes('document') ? '📘' :
                           selected.fichierType?.includes('image') ? '🖼️' : '📄'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{selected.fichierNom}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs ${muted}`}>
                              {selected.fichierType?.includes('pdf') ? 'PDF' :
                               selected.fichierType?.includes('word') || selected.fichierType?.includes('document') ? 'Word' :
                               selected.fichierNom?.split('.').pop()?.toUpperCase() ?? 'Fichier'}
                            </span>
                            {selected.fichierTaille && (
                              <span className={`text-xs ${muted}`}>· {formatFileSize(selected.fichierTaille)}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(selected.id, selected.fichierNom || 'rapport.pdf')}
                          disabled={downloadingId === selected.id}
                          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl text-white disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                          {downloadingId === selected.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Download size={12} />}
                          Télécharger
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contenu texte */}
                  {selected.contenu && (
                    <div className={`rounded-2xl border ${card} p-5`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider ${muted} mb-3`}>Contenu du rapport</p>
                      <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selected.contenu}
                      </p>
                    </div>
                  )}

                  {/* Score */}
                  <div className={`rounded-2xl border ${card} p-5`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Award size={15} className="text-amber-500" /> Note / Score
                      </h3>
                      {selected.score && selected.score > 0 && (
                        <span className="text-xs font-bold text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-lg">
                          Note actuelle : {selected.score}/5
                        </span>
                      )}
                    </div>
                    <ScoreStars value={score} onChange={setScore}
                      readonly={selected.statut !== 'SOUMIS' && selected.statut !== 'VALIDE'} />
                    <div className="grid grid-cols-5 gap-1 mt-3">
                      {[
                        { n: 1, label: 'Insuffisant', color: 'text-red-500' },
                        { n: 2, label: 'Passable',    color: 'text-orange-500' },
                        { n: 3, label: 'Bien',        color: 'text-amber-500' },
                        { n: 4, label: 'Très bien',   color: 'text-emerald-500' },
                        { n: 5, label: 'Excellent',   color: 'text-purple-600' },
                      ].map(({ n, label, color }) => (
                        <div key={n} className={`text-center text-xs ${score === n ? color : muted}`}>{label}</div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Valider / Rejeter */}
                  {selected.statut === 'SOUMIS' && (
                    <div className={`rounded-2xl border ${card} p-5`}>
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <BarChart3 size={15} className="text-purple-500" /> Décision
                      </h3>
                      <div className="flex gap-3">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => handleValider('VALIDE')} disabled={validating}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg, #006c48, #059669)' }}>
                          {validating ? <Loader2 size={15} className="animate-spin" /> : <><ThumbsUp size={15} /> Valider</>}
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                          onClick={() => handleValider('REJETE')} disabled={validating}
                          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-60 bg-red-600 hover:bg-red-700 transition-colors">
                          <ThumbsDown size={15} /> Rejeter
                        </motion.button>
                      </div>
                      {score === 0 && (
                        <p className={`text-xs text-center mt-2 flex items-center justify-center gap-1 ${muted}`}>
                          <AlertCircle size={11} /> Pensez à attribuer une note avant de valider
                        </p>
                      )}
                    </div>
                  )}

                  {/* Commentaires */}
                  <div className={`rounded-2xl border ${card} p-5`}>
                    <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                      <MessageSquare size={15} className="text-purple-500" />
                      Commentaires ({selected.commentaires?.length ?? 0})
                    </h3>
                    {(selected.commentaires?.length ?? 0) === 0 ? (
                      <p className={`text-sm text-center py-4 ${muted}`}>Aucun commentaire pour l'instant</p>
                    ) : (
                      <div className="space-y-3 mb-4">
                        {selected.commentaires?.map(c => (
                          <div key={c.id} className={`p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-purple-50'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-bold" style={{ color: '#421384' }}>{c.auteur?.nom ?? 'Encadrant'}</p>
                              <p className={`text-xs ${muted}`}>{new Date(c.dateCreation).toLocaleDateString('fr-FR')}</p>
                            </div>
                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{c.contenu}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <textarea ref={commentRef} value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Écrivez un commentaire ou retour pour l'étudiant..."
                        rows={3}
                        className={`flex-1 text-sm px-4 py-3 border rounded-xl outline-none resize-none transition-all ${input}`} />
                      <button onClick={handleSendComment} disabled={sendingCom || !comment.trim()}
                        className="flex flex-col items-center justify-center gap-1 px-4 rounded-xl text-white font-semibold text-xs disabled:opacity-50 transition-all"
                        style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                        {sendingCom ? <Loader2 size={15} className="animate-spin" /> : <><Send size={15} /><span>Envoyer</span></>}
                      </button>
                    </div>
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