import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Calendar, Plus, Search, Edit3,
  Trash2, Check, X, Clock, AlertCircle,
  CheckCircle2, Save, Loader2, CalendarDays,
  ChevronLeft, ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import api from '../services/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Deadline {
  id: number
  titre?: string
  type?: string
  description?: string
  dateLimite?: string
  dateEcheance?: string
  dateCreation?: string
  statut?: 'ACTIVE' | 'EXPIREE' | 'BIENTOT'
  encadrant?: { id: number; nom: string }
}

// ─── Calendar Helpers ─────────────────────────────────────────────────────────
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
const getFirstDayOfMonth = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1
}
const formatDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getDate = (d: Deadline) => d.dateLimite || d.dateEcheance || ''
const getTitre = (d: Deadline) => d.titre || d.type || 'Sans titre'

const getStatut = (dateStr: string): 'EXPIREE' | 'BIENTOT' | 'ACTIVE' => {
  if (!dateStr) return 'ACTIVE'
  const diff = (new Date(dateStr).getTime() - Date.now()) / 86400000
  if (diff < 0) return 'EXPIREE'
  if (diff <= 7) return 'BIENTOT'
  return 'ACTIVE'
}

const daysLeft = (dateStr: string) => {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `Expirée il y a ${Math.abs(diff)} j`
  if (diff === 0) return "Aujourd'hui !"
  if (diff === 1) return 'Demain'
  return `Dans ${diff} jours`
}

const STATUT_CONFIG = {
  ACTIVE:  { label: 'Active',  dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', border: 'border-l-emerald-500' },
  BIENTOT: { label: 'Bientôt', dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',        border: 'border-l-amber-500' },
  EXPIREE: { label: 'Expirée', dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',               border: 'border-l-gray-400' },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SupervisorDeadlinesPage() {
  const navigate  = useNavigate()
  const isDark    = localStorage.getItem('theme') === 'dark'
  const userId    = Number(localStorage.getItem('userId'))

  // ── Data ───────────────────────────────────────────────────────────────────
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading,   setLoading]   = useState(true)

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'BIENTOT' | 'EXPIREE'>('ALL')

  // ── Add / Edit modal ───────────────────────────────────────────────────────
  const [showModal,  setShowModal]  = useState(false)
  const [editTarget, setEditTarget] = useState<Deadline | null>(null)
  const [form, setForm] = useState({ titre: '', dateLimite: '', description: '' })
  const [saving, setSaving] = useState(false)

  // ── Calendar state ─────────────────────────────────────────────────────────
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Deadline Limit Overlay ─────────────────────────────────────────────────
  const [showLimitOverlay, setShowLimitOverlay] = useState(false)
  const [nextDeadlineDate, setNextDeadlineDate] = useState<Date | null>(null)
  const [timeLeftDL, setTimeLeftDL] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  // ── Countdown effect ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!nextDeadlineDate) return
    const update = () => {
      const now = new Date()
      const diff = nextDeadlineDate.getTime() - now.getTime()
      if (diff <= 0) {
        setNextDeadlineDate(null)
        setTimeLeftDL({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      setTimeLeftDL({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [nextDeadlineDate])

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchDeadlines = async () => {
    setLoading(true)
    try {
      const res = await api.get<Deadline[]>(`/deadlines/encadrant/${userId}`)
      setDeadlines(res.data)
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDeadlines() }, [userId])

  // ── Vérifier la limite AVANT d'ouvrir le modal ──────────────────────────────
  const checkAndOpenAddModal = async () => {
    try {
      const res = await api.get<Deadline[]>(`/deadlines/encadrant/${userId}`)
      const allDeadlines = res.data

      const now = new Date()
      const day = now.getDay()
      const diffToMonday = day === 0 ? -6 : 1 - day
      const debutSemaine = new Date(now)
      debutSemaine.setDate(now.getDate() + diffToMonday)
      debutSemaine.setHours(0, 0, 0, 0)

      const createdThisWeek = allDeadlines.filter((d: Deadline) => {
        if (!d.dateCreation && !d.dateLimite) return false
        const dateStr = d.dateCreation || d.dateLimite
        const date = new Date(dateStr)
        return date >= debutSemaine
      })

      if (createdThisWeek.length > 0) {
        const finSemaine = new Date(debutSemaine)
        finSemaine.setDate(finSemaine.getDate() + 7)
        setNextDeadlineDate(finSemaine)
        setShowLimitOverlay(true)
      } else {
        setEditTarget(null)
        setForm({ titre: '', dateLimite: '', description: '' })
        setCalYear(new Date().getFullYear())
        setCalMonth(new Date().getMonth())
        setShowModal(true)
      }
    } catch {
      setEditTarget(null)
      setForm({ titre: '', dateLimite: '', description: '' })
      setCalYear(new Date().getFullYear())
      setCalMonth(new Date().getMonth())
      setShowModal(true)
    }
  }

  // ── Open edit modal ────────────────────────────────────────────────────────
  const openEdit = (d: Deadline) => {
    setEditTarget(d)
    setForm({
      titre:       getTitre(d),
      dateLimite:  getDate(d),
      description: d.description ?? '',
    })
    if (d.dateLimite) {
      const dateObj = new Date(d.dateLimite)
      setCalYear(dateObj.getFullYear())
      setCalMonth(dateObj.getMonth())
    } else {
      setCalYear(new Date().getFullYear())
      setCalMonth(new Date().getMonth())
    }
    setShowModal(true)
  }

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.titre.trim() || !form.dateLimite) {
      toast.error('Titre et date requis')
      return
    }
    setSaving(true)
    try {
      const payload = {
        type: form.titre,
        titre: form.titre,
        dateLimite: form.dateLimite,
        description: form.description,
        encadrantId: String(userId),
      }

      if (editTarget) {
        const res = await api.put(`/deadlines/${editTarget.id}`, payload)
        setDeadlines(prev => prev.map(d => d.id === editTarget.id ? { ...d, ...res.data } : d))
        toast.success('Deadline modifiée !')
      } else {
        const res = await api.post('/deadlines', payload)
        setDeadlines(prev => [res.data, ...prev])
        toast.success('Deadline créée !')
      }
      setShowModal(false)
    } catch (error: any) {
      let errorMsg = 'Erreur inconnue'
      if (typeof error.response?.data === 'string') {
        errorMsg = error.response.data
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message
      }

      const errorHeader = error.response?.headers?.['x-error-type'] || ''
      const isLimitError =
        errorHeader === 'LIMIT_ERROR' ||
        errorMsg.toLowerCase().includes('limite') ||
        errorMsg.toLowerCase().includes('hebdomadaire') ||
        errorMsg.toLowerCase().includes('semaine') ||
        errorMsg.toLowerCase().includes('deja')

      if (isLimitError) {
        const now = new Date()
        const day = now.getDay()
        const diffToMonday = day === 0 ? -6 : 1 - day
        const debutSemaine = new Date(now)
        debutSemaine.setDate(now.getDate() + diffToMonday)
        debutSemaine.setHours(0, 0, 0, 0)
        const finSemaine = new Date(debutSemaine)
        finSemaine.setDate(finSemaine.getDate() + 7)

        setNextDeadlineDate(finSemaine)
        setShowLimitOverlay(true)
        setShowModal(false)
      } else {
        toast.error(errorMsg)
        if (editTarget) {
          setDeadlines(prev => prev.map(d => d.id === editTarget.id
            ? { ...d, type: form.titre, titre: form.titre, dateLimite: form.dateLimite, description: form.description }
            : d
          ))
        } else {
          setDeadlines(prev => [{
            id: Date.now(),
            titre: form.titre, type: form.titre,
            dateLimite: form.dateLimite,
            description: form.description,
            encadrant: { id: userId, nom: '' },
          }, ...prev])
        }
        setShowModal(false)
      }
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.delete(`/deadlines/${deleteId}`)
    } catch { /* ignore */ }
    setDeadlines(prev => prev.filter(d => d.id !== deleteId))
    toast.success('Deadline supprimée')
    setDeleteId(null)
    setDeleting(false)
  }

  // ── Navigate back ──────────────────────────────────────────────────────────
  const goBack = () => {
    const role = localStorage.getItem('role')
    if (role === 'ENCADRANT') navigate('/supervisor')
    else if (role === 'ADMIN') navigate('/admin')
    else navigate('/student')
  }

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = deadlines
    .filter(d => {
      if (filter === 'ALL') return true
      return getStatut(getDate(d)) === filter
    })
    .filter(d =>
      getTitre(d).toLowerCase().includes(search.toLowerCase()) ||
      (d.description ?? '').toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const da = getDate(a), db = getDate(b)
      if (!da && !db) return 0
      if (!da) return 1
      if (!db) return -1
      return new Date(da).getTime() - new Date(db).getTime()
    })

  const total    = deadlines.length
  const actives  = deadlines.filter(d => getStatut(getDate(d)) === 'ACTIVE').length
  const bientot  = deadlines.filter(d => getStatut(getDate(d)) === 'BIENTOT').length
  const expirees = deadlines.filter(d => getStatut(getDate(d)) === 'EXPIREE').length

  // ── Styles ─────────────────────────────────────────────────────────────────
  const bg    = isDark ? 'bg-gray-950' : 'bg-white'
  const card  = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-purple-100'
  const input = isDark
    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500'
    : 'bg-white border-purple-200 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10'
  const muted = isDark ? 'text-gray-400' : 'text-gray-500'

  // ── Calendar rendering ──────────────────────────────────────────────────────
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calYear, calMonth)
    const firstDay = getFirstDayOfMonth(calYear, calMonth)
    const today = new Date()
    const todayStr = formatDateStr(today)
    const selectedDate = form.dateLimite

    const prevMonth = () => {
      if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
      else setCalMonth(m => m - 1)
    }
    const nextMonth = () => {
      if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
      else setCalMonth(m => m + 1)
    }

    const cells: React.ReactNode[] = []
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-8" />)
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(calYear, calMonth, d)
      const dateStr = formatDateStr(dateObj)
      const isToday = dateStr === todayStr
      const isSelected = dateStr === selectedDate
      const isPast = dateObj < new Date(today.getFullYear(), today.getMonth(), today.getDate())

      cells.push(
        <motion.button
          key={d}
          whileHover={!isPast ? { scale: 1.15 } : {}}
          whileTap={!isPast ? { scale: 0.9 } : {}}
          disabled={isPast}
          onClick={() => !isPast && setForm(f => ({ ...f, dateLimite: dateStr }))}
          className={`h-8 w-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all
            ${isPast ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed' : 'cursor-pointer'}
            ${isToday && !isSelected ? `ring-1 ${isDark ? 'ring-purple-500' : 'ring-purple-400'}` : ''}
            ${isSelected
              ? 'text-white shadow-lg'
              : isPast ? '' : isDark ? 'text-gray-300 hover:bg-purple-900/30' : 'text-gray-700 hover:bg-purple-50'
            }`}
          style={isSelected ? { background: 'linear-gradient(135deg, #421384, #6d28d9)' } : {}}
        >
          {d}
        </motion.button>
      )
    }

    return (
      <div className={`rounded-xl p-3 ${isDark ? 'bg-gray-800/50' : 'bg-purple-50/50'}`}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-purple-100 text-gray-500'}`}>
            <ChevronLeft size={14} />
          </button>
          <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {MONTHS_FR[calMonth]} {calYear}
          </span>
          <button onClick={nextMonth}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-purple-100 text-gray-500'}`}>
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS_FR.map(dn => (
            <div key={dn} className={`h-6 flex items-center justify-center text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {dn}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells}
        </div>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium ${
              isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
            }`}
          >
            <CalendarDays size={13} />
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </motion.div>
        )}
      </div>
    )
  }

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
              <CalendarDays size={18} className="text-purple-600" />
              Gestion des Deadlines
            </h1>
            <p className={`text-xs ${muted}`}>{total} deadline{total > 1 ? 's' : ''} au total</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={checkAndOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg"
          style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}
        >
          <Plus size={16} /> Nouvelle deadline
        </motion.button>
      </motion.header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total',    val: total,    color: isDark ? 'text-gray-100' : 'text-gray-800', bg: `border ${card}`,                                              icon: CalendarDays, iconCl: 'text-purple-500' },
            { label: 'Actives',  val: actives,  color: 'text-emerald-600', bg: 'bg-emerald-50 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30', icon: CheckCircle2, iconCl: 'text-emerald-500' },
            { label: 'Bientôt',  val: bientot,  color: 'text-amber-600',   bg: 'bg-amber-50 border border-amber-100 dark:bg-amber-900/20 dark:border-amber-900/30',       icon: Clock,        iconCl: 'text-amber-500' },
            { label: 'Expirées', val: expirees, color: 'text-gray-500',    bg: `border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-200'}`,          icon: AlertCircle,  iconCl: 'text-gray-400' },
          ].map(({ label, val, color, bg: sbg, icon: Icon, iconCl }) => (
            <motion.div key={label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-4 ${sbg} shadow-sm flex items-center gap-3`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <Icon size={16} className={iconCl} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${color}`}>{val}</p>
                <p className={`text-xs ${muted}`}>{label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Search + Filtres ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-purple-200'}`}>
            <Search size={15} className={muted} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une deadline..."
              className="flex-1 text-sm bg-transparent outline-none" />
            {search && <button onClick={() => setSearch('')}><X size={14} className={muted} /></button>}
          </div>

          <div className={`flex gap-1 p-1 rounded-xl border ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-purple-100'}`}>
            {(['ALL', 'ACTIVE', 'BIENTOT', 'EXPIREE'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filter === f
                    ? f === 'ALL'     ? 'text-white' :
                      f === 'ACTIVE'  ? 'bg-emerald-500 text-white' :
                      f === 'BIENTOT' ? 'bg-amber-500 text-white' :
                                        'bg-gray-500 text-white'
                    : `${muted} hover:bg-purple-50 dark:hover:bg-gray-800`
                }`}
                style={filter === f && f === 'ALL' ? { background: 'linear-gradient(135deg, #421384, #6d28d9)' } : {}}>
                {f === 'ALL' ? 'Toutes' : f === 'ACTIVE' ? 'Actives' : f === 'BIENTOT' ? 'Bientôt' : 'Expirées'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Liste ─────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-purple-500" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`rounded-2xl border ${card} p-20 text-center shadow-sm`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-gray-800' : 'bg-purple-50'}`}>
              <CalendarDays size={28} className="text-purple-400" />
            </div>
            <p className="font-semibold text-lg mb-1">
              {deadlines.length === 0 ? 'Aucune deadline' : 'Aucun résultat'}
            </p>
            <p className={`text-sm ${muted} mb-5`}>
              {deadlines.length === 0 ? 'Créez votre première deadline pour vos étudiants.' : 'Modifiez votre recherche ou filtre.'}
            </p>
            {deadlines.length === 0 && (
              <button onClick={checkAndOpenAddModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                <Plus size={15} /> Créer une deadline
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filtered.map((dl, i) => {
              const date   = getDate(dl)
              const titre  = getTitre(dl)
              const statut = getStatut(date)
              const cfg    = STATUT_CONFIG[statut]
              const days   = daysLeft(date)

              return (
                <motion.div key={dl.id}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ x: 3, transition: { duration: 0.15 } }}
                  className={`rounded-2xl border-l-4 ${cfg.border} border ${isDark ? 'border-gray-800 bg-gray-900' : 'border-purple-100 bg-white'} p-5 shadow-sm`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                        statut === 'ACTIVE'  ? 'bg-purple-100 dark:bg-purple-900/30' :
                        statut === 'BIENTOT' ? 'bg-amber-100 dark:bg-amber-900/30' :
                                              'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <span className={`text-xs font-bold ${
                          statut === 'ACTIVE' ? 'text-purple-600 dark:text-purple-400' :
                          statut === 'BIENTOT' ? 'text-amber-600' : 'text-gray-400'
                        }`}>
                          {date ? new Date(date).toLocaleDateString('fr-FR', { day: '2-digit' }) : '—'}
                        </span>
                        <span className={`text-xs ${muted}`}>
                          {date ? new Date(date).toLocaleDateString('fr-FR', { month: 'short' }) : ''}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-0.5">{titre}</h3>
                        {dl.description && (
                          <p className={`text-xs mb-1.5 line-clamp-2 ${muted}`}>{dl.description}</p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`text-xs flex items-center gap-1 ${muted}`}>
                            <Calendar size={11} />
                            {date ? new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                          </span>
                          {days && (
                            <span className={`text-xs font-semibold flex items-center gap-1 ${
                              statut === 'BIENTOT' ? 'text-amber-600' :
                              statut === 'EXPIREE' ? 'text-gray-400' : 'text-purple-600 dark:text-purple-400'
                            }`}>
                              <Clock size={11} /> {days}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>

                      <button onClick={() => openEdit(dl)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isDark ? 'bg-gray-800 hover:bg-purple-900/40 text-gray-400 hover:text-purple-400'
                                 : 'bg-gray-100 hover:bg-purple-50 text-gray-400 hover:text-purple-600'
                        }`}>
                        <Edit3 size={13} />
                      </button>

                      <button onClick={() => setDeleteId(dl.id)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isDark ? 'bg-gray-800 hover:bg-red-900/30 text-gray-400 hover:text-red-400'
                                 : 'bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500'
                        }`}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ══ Modal Add / Edit ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
            onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 28 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(66,19,132,0.08)'}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                      {editTarget ? <Edit3 size={16} className="text-white" /> : <Plus size={16} className="text-white" />}
                    </div>
                    <div>
                      <h2 className="font-bold text-base">{editTarget ? 'Modifier la deadline' : 'Nouvelle deadline'}</h2>
                      <p className={`text-xs ${muted}`}>{editTarget ? 'Mettre à jour les informations' : 'Créer une deadline pour vos étudiants'}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowModal(false)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Titre */}
                <div>
                  <label className={`text-xs font-semibold tracking-wider uppercase mb-2 block ${muted}`}>Titre *</label>
                  <input type="text" value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
                    placeholder="Ex: Rendu rapport final, Soutenance..."
                    className={`w-full h-10 px-4 border rounded-xl text-sm outline-none transition-all ${input}`}
                  />
                </div>

                {/* Calendrier interactif */}
                <div>
                  <label className={`text-xs font-semibold tracking-wider uppercase mb-2 block ${muted}`}>
                    <span className="flex items-center gap-1.5"><CalendarDays size={12} /> Date limite *</span>
                  </label>
                  {renderCalendar()}
                </div>

                {/* Description */}
                <div>
                  <label className={`text-xs font-semibold tracking-wider uppercase mb-2 block ${muted}`}>Description (optionnel)</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Instructions, détails pour les étudiants..."
                    rows={3}
                    className={`w-full px-4 py-3 border rounded-xl text-sm outline-none resize-none transition-all ${input}`}
                  />
                </div>

                {/* Boutons */}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowModal(false)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                    Annuler
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSave} disabled={saving}
                    className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                    {saving
                      ? <Loader2 size={15} className="animate-spin" />
                      : editTarget
                      ? <><Save size={14} /> Sauvegarder</>
                      : <><Plus size={14} /> Créer</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Confirm Delete ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteId !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
            onClick={() => setDeleteId(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={24} className="text-red-500" />
                </div>
                <h3 className="font-bold text-lg mb-1">Supprimer la deadline ?</h3>
                <p className={`text-sm ${muted}`}>Cette action est irréversible.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setDeleteId(null)} disabled={deleting}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Annuler
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors">
                  {deleting ? <Loader2 size={14} className="animate-spin" /> : <><Trash2 size={14} /> Supprimer</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Deadline Limit Overlay ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showLimitOverlay && nextDeadlineDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
            onClick={() => setShowLimitOverlay(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', damping: 25 }}
              className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #f59e0b, #ef4444, #f59e0b)' }} />

              <div className="p-8 text-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                  className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-amber-900/30' : 'bg-amber-50'}`}
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#f59e0b' : '#d97706'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </motion.div>

                <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Limite Hebdomadaire Atteinte
                </h2>
                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Vous ne pouvez créer qu'une seule deadline par semaine. Votre prochaine création sera disponible dans :
                </p>

                <div className="flex items-center justify-center gap-3 mb-6">
                  {[
                    { value: timeLeftDL.days, label: 'Jours' },
                    { value: timeLeftDL.hours, label: 'Heures' },
                    { value: timeLeftDL.minutes, label: 'Min' },
                    { value: timeLeftDL.seconds, label: 'Sec' },
                  ].map((unit, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${
                        isDark ? 'bg-gray-800 text-amber-400' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {String(unit.value).padStart(2, '0')}
                      </div>
                      <span className={`text-xs mt-1.5 font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${
                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-50 text-gray-600'
                }`}>
                  <CalendarDays size={14} />
                  Disponible le {nextDeadlineDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>

                <button
                  onClick={() => setShowLimitOverlay(false)}
                  className={`mt-6 w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  J'ai compris
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}