import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Calendar, Plus, Search, Edit3,
  Trash2, Check, X, Clock, AlertCircle,
  CheckCircle2, Filter, ChevronDown, Save,
  Loader2, CalendarDays, Flag
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
  statut?: 'ACTIVE' | 'EXPIREE' | 'BIENTOT'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getDate = (d: Deadline) => d.dateLimite || d.dateEcheance || ''
const getTitre = (d: Deadline) => d.titre || d.type || 'Sans titre'

const getStatut = (dateStr: string): 'EXPIREE' | 'BIENTOT' | 'ACTIVE' => {
  if (!dateStr) return 'ACTIVE'
  const diff = (new Date(dateStr).getTime() - Date.now()) / 86400000
  if (diff < 0)  return 'EXPIREE'
  if (diff <= 7) return 'BIENTOT'
  return 'ACTIVE'
}

const daysLeft = (dateStr: string) => {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
  if (diff < 0)  return `Expirée il y a ${Math.abs(diff)} j`
  if (diff === 0) return "Aujourd'hui !"
  if (diff === 1) return 'Demain'
  return `Dans ${diff} jours`
}

const STATUT_CONFIG = {
  ACTIVE:  { label: 'Active',   dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', border: 'border-l-emerald-500' },
  BIENTOT: { label: 'Bientôt',  dot: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',         border: 'border-l-amber-500' },
  EXPIREE: { label: 'Expirée',  dot: 'bg-gray-400',    badge: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',                border: 'border-l-gray-400' },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SupervisorDeadlinesPage() {
  const navigate  = useNavigate()
  const isDark    = localStorage.getItem('theme') === 'dark'

  // ── Data ───────────────────────────────────────────────────────────────────
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading,   setLoading]   = useState(true)

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search,    setSearch]    = useState('')
  const [filter,    setFilter]    = useState<'ALL' | 'ACTIVE' | 'BIENTOT' | 'EXPIREE'>('ALL')

  // ── Add / Edit modal ───────────────────────────────────────────────────────
  const [showModal,  setShowModal]  = useState(false)
  const [editTarget, setEditTarget] = useState<Deadline | null>(null)
  const [form, setForm] = useState({ titre: '', dateLimite: '', description: '' })
  const [saving, setSaving] = useState(false)

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchDeadlines = async () => {
    setLoading(true)
    try {
      const res = await api.get<Deadline[]>('/deadlines')
      setDeadlines(res.data)
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDeadlines() }, [])

  // ── Open modal ─────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null)
    setForm({ titre: '', dateLimite: '', description: '' })
    setShowModal(true)
  }

  const openEdit = (d: Deadline) => {
    setEditTarget(d)
    setForm({
      titre:       getTitre(d),
      dateLimite:  getDate(d),
      description: d.description ?? '',
    })
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
        type:        form.titre,
        titre:       form.titre,
        dateLimite:  form.dateLimite,
        description: form.description,
      }

      if (editTarget) {
        const res = await api.put<Deadline>(`/deadlines/${editTarget.id}`, payload)
        setDeadlines(prev => prev.map(d => d.id === editTarget.id ? res.data : d))
        toast.success('Deadline modifiée !')
      } else {
        const res = await api.post<Deadline>('/deadlines', payload)
        setDeadlines(prev => [res.data, ...prev])
        toast.success('Deadline créée !')
      }
      setShowModal(false)
    } catch {
      // fallback local
      if (editTarget) {
        setDeadlines(prev => prev.map(d => d.id === editTarget.id
          ? { ...d, type: form.titre, titre: form.titre, dateLimite: form.dateLimite, description: form.description }
          : d
        ))
        toast.success('Deadline modifiée !')
      } else {
        setDeadlines(prev => [{
          id: Date.now(),
          titre: form.titre, type: form.titre,
          dateLimite: form.dateLimite,
          description: form.description,
        }, ...prev])
        toast.success('Deadline créée !')
      }
      setShowModal(false)
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

  // ── Navigate back based on role ────────────────────────────────────────────
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

  // Stats
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
          onClick={openAdd}
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
              <button onClick={openAdd}
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
                      {/* Icône date */}
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

                    {/* Actions + badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${cfg.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>

                      {/* Edit */}
                      <button onClick={() => openEdit(dl)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isDark ? 'bg-gray-800 hover:bg-purple-900/40 text-gray-400 hover:text-purple-400'
                                 : 'bg-gray-100 hover:bg-purple-50 text-gray-400 hover:text-purple-600'
                        }`}>
                        <Edit3 size={13} />
                      </button>

                      {/* Delete */}
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

              {/* Body */}
              <div className="p-6 space-y-4">
                {/* Titre */}
                <div>
                  <label className={`text-xs font-semibold tracking-wider uppercase mb-1.5 block ${muted}`}>Titre *</label>
                  <input type="text" value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
                    placeholder="Ex: Rendu rapport final, Soutenance..."
                    className={`w-full h-10 px-4 border rounded-xl text-sm outline-none transition-all ${input}`}
                  />
                </div>

                {/* Date */}
                <div>
                  <label className={`text-xs font-semibold tracking-wider uppercase mb-1.5 block ${muted}`}>Date limite *</label>
                  <input type="date" value={form.dateLimite} onChange={e => setForm(p => ({ ...p, dateLimite: e.target.value }))}
                    className={`w-full h-10 px-4 border rounded-xl text-sm outline-none transition-all ${input}`}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className={`text-xs font-semibold tracking-wider uppercase mb-1.5 block ${muted}`}>Description (optionnel)</label>
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
                <p className={`text-sm ${muted}`}>Cette action est irréversible. La deadline sera définitivement supprimée.</p>
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
    </div>
  )
}