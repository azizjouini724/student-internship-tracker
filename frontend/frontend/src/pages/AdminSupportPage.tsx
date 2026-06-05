import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  HelpCircle,
  Loader2,
  Search,
  Filter,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  BarChart3,
  List,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

type SupportType = 'question' | 'bug' | 'autre' | string

type SupportStatut = 'EN_ATTENTE' | 'EN_COURS' | 'RESOLU' | string

type UserLite = {
  id: number
  nom: string
  email?: string
}

type SupportMessage = {
  id: number
  sujet: string
  type: SupportType
  message: string
  auteur?: UserLite
  dateEnvoi?: string
  lu: boolean
  reponse?: string
  dateReponse?: string
  admin?: UserLite
  statut: SupportStatut
}

const STATUT_LABEL: Record<string, string> = {
  EN_ATTENTE: 'En attente',
  EN_COURS: 'En cours',
  RESOLU: 'Résolu',
}

const TYPE_LABEL: Record<string, string> = {
  question: 'Question',
  bug: 'Bug / Erreur',
  autre: 'Autre',
}

function safeDate(dateStr?: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function computeResponseTimeMs(msg: SupportMessage) {
  if (!msg.dateEnvoi || !msg.dateReponse) return null
  const d1 = new Date(msg.dateEnvoi).getTime()
  const d2 = new Date(msg.dateReponse).getTime()
  if (Number.isNaN(d1) || Number.isNaN(d2) || d2 < d1) return null
  return d2 - d1
}

function formatDuration(ms: number) {
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 48) return `${hours} h`
  const days = Math.round(hours / 24)
  return `${days} j`
}

export default function AdminSupportPage() {
  const navigate = useNavigate()
  const isDark = localStorage.getItem('theme') === 'dark'

  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | SupportType>('all')
  const [statutFilter, setStatutFilter] = useState<'all' | SupportStatut>('all')

  const [activeId, setActiveId] = useState<number | null>(null)
  const activeMessage = useMemo(
    () => messages.find((m) => m.id === activeId) ?? null,
    [messages, activeId]
  )

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const res = await api.get<SupportMessage[]>('/support')
        // Ensure shape even if backend returns extras
        setMessages(res.data ?? [])
      } catch (e) {
        console.error(e)
        toast.error("Erreur de chargement du support")
      } finally {
        setLoading(false)
      }
    }

    fetch()
  }, [])

  const nonLusCount = useMemo(() => messages.filter((m) => !m.lu).length, [messages])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return messages
      .filter((m) => (typeFilter === 'all' ? true : m.type === typeFilter))
      .filter((m) => (statutFilter === 'all' ? true : m.statut === statutFilter))
      .filter((m) => {
        if (!q) return true
        const author = m.auteur?.nom?.toLowerCase() ?? ''
        return (
          m.sujet?.toLowerCase().includes(q) ||
          m.message?.toLowerCase().includes(q) ||
          author.includes(q)
        )
      })
  }, [messages, search, typeFilter, statutFilter])

  useEffect(() => {
    if (activeId == null && filtered.length > 0) setActiveId(filtered[0].id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, filtered.length])

  const stats = useMemo(() => {
    const total = messages.length
    const nonLus = nonLusCount

    const byStatut = new Map<string, number>()
    const byType = new Map<string, number>()

    messages.forEach((m) => {
      byStatut.set(m.statut, (byStatut.get(m.statut) ?? 0) + 1)
      byType.set(m.type, (byType.get(m.type) ?? 0) + 1)
    })

    const resolved = messages.filter((m) => m.statut === 'RESOLU').length

    const responseTimesMs = messages
      .map((m) => computeResponseTimeMs(m))
      .filter((x): x is number => typeof x === 'number')

    const avgResponseMs =
      responseTimesMs.length > 0
        ? Math.round(responseTimesMs.reduce((a, b) => a + b, 0) / responseTimesMs.length)
        : null

    const resRate = total > 0 ? Math.round((resolved / total) * 100) : 0

    return {
      total,
      nonLus,
      resolved,
      resRate,
      avgResponseMs,
      byStatut,
      byType,
    }
  }, [messages, nonLusCount])

  const axisColor = isDark ? '#e5e7eb' : '#6b7280'
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,37,136,0.10)'

  const bg = isDark ? 'bg-gray-950' : 'bg-gray-50'
  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'
  const borderSoft = isDark ? 'border-gray-800' : 'border-slate-200'
  const input = isDark
    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-blue-500'
    : 'bg-white border-slate-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
  const muted = isDark ? 'text-gray-400' : 'text-gray-500'

  const renderBar = (value: number, max: number) => {
    const pct = max > 0 ? (value / max) * 100 : 0
    return (
      <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-800' : 'bg-slate-100'} overflow-hidden`}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: 'linear-gradient(135deg, #142588, #303f9f)' }}
        />
      </div>
    )
  }

  const maxByType = useMemo(() => Math.max(0, ...Array.from(stats.byType.values())), [stats.byType])
  const maxByStatut = useMemo(
    () => Math.max(0, ...Array.from(stats.byStatut.values())),
    [stats.byStatut]
  )

  const handleSelectMessage = (id: number) => {
    setActiveId(id)
  }

  const updateStatus = async (id: number, statut: SupportStatut) => {
    try {
      await api.put(`/support/${id}/statut`, { statut })
      setMessages(prev => prev.map(m => m.id === id ? { ...m, statut } : m))
      toast.success("Statut mis à jour")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors de la mise à jour du statut")
    }
  }

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/support/${id}/lire`)
      setMessages(prev => prev.map(m => m.id === id ? { ...m, lu: true } : m))
      toast.success("Message marqué comme lu")
    } catch (e) {
      console.error(e)
      toast.error("Erreur lors du marquage comme lu")
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${bg} text-gray-100 flex items-center justify-center`}>
        <Toaster position="top-right" richColors />
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin" />
          <span className={muted}>Chargement…</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${bg} text-gray-900 dark:text-gray-100 font-sans`}>
      <Toaster position="top-right" richColors />

      {/* TOPBAR */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b backdrop-blur-md ${
          isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ x: -3 }}
            onClick={() => navigate('/admin')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
            }`}
          >
            <ArrowLeft size={18} />
          </motion.button>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <HelpCircle className={isDark ? 'text-blue-300' : 'text-blue-600'} size={18} />
              Support Admin
            </h2>
            <p className={`text-xs ${muted}`}>Problèmes envoyés + statistiques</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              nonLusCount > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : `${card}`
            } border ${nonLusCount > 0 ? 'border-red-100 dark:border-red-900/30' : borderSoft}`}
          >
            <div className="flex items-center gap-2">
              {nonLusCount > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
              <span>
                {nonLusCount} non lu{nonLusCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* MAIN */}
      <div className="p-8">
        {/* HORIZONTAL KPIs */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid grid-cols-2 md:grid-cols-5 gap-4"
        >
          <div className={`rounded-2xl border ${card} p-4 flex flex-col justify-center`}>
            <span className={`text-sm ${muted} mb-1`}>Total messages</span>
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <div className={`rounded-2xl border ${card} p-4 flex flex-col justify-center`}>
            <span className={`text-sm ${muted} mb-1`}>Non lus</span>
            <span className="text-2xl font-bold text-red-500">{stats.nonLus}</span>
          </div>
          <div className={`rounded-2xl border ${card} p-4 flex flex-col justify-center`}>
            <span className={`text-sm ${muted} mb-1`}>Résolus</span>
            <span className="text-2xl font-bold text-emerald-500">{stats.resolved}</span>
          </div>
          <div className={`rounded-2xl border ${card} p-4 flex flex-col justify-center`}>
            <span className={`text-sm ${muted} mb-1`}>Taux résolu</span>
            <span className={`text-2xl font-bold ${stats.resRate >= 50 ? 'text-emerald-500' : 'text-amber-500'}`}>{stats.resRate}%</span>
          </div>
          <div className={`rounded-2xl border ${card} p-4 flex flex-col justify-center`}>
            <span className={`text-sm ${muted} mb-1`}>Temps moy. rép.</span>
            <span className="text-2xl font-bold">{stats.avgResponseMs == null ? '—' : formatDuration(stats.avgResponseMs)}</span>
          </div>
        </motion.div>

        {/* MAIN GRID */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid grid-cols-12 gap-4"
        >
          <div className="col-span-12 lg:col-span-8">
            <div className={`rounded-2xl border ${card} p-5`}> 
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-base">Vue globale</h3>
                  <p className={`text-xs ${muted}`}>Liste des messages reçus par les admins + indicateurs</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <div className="relative">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${input}`}>
                      <Search size={14} className={muted} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher (sujet, contenu, auteur)…"
                        className="bg-transparent outline-none text-sm w-[320px] max-w-[70vw]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                        isDark
                          ? 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      } flex items-center gap-2`}
                      onClick={() => {
                        setTypeFilter('all')
                        setStatutFilter('all')
                        setSearch('')
                      }}
                    >
                      <Filter size={14} />
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className={`h-10 px-3 rounded-xl text-sm border outline-none ${input}`}
                >
                  <option value="all">Tous les types</option>
                  <option value="question">Question</option>
                  <option value="bug">Bug / Erreur</option>
                  <option value="autre">Autre</option>
                </select>

                <select
                  value={statutFilter}
                  onChange={(e) => setStatutFilter(e.target.value as any)}
                  className={`h-10 px-3 rounded-xl text-sm border outline-none ${input}`}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="EN_COURS">En cours</option>
                  <option value="RESOLU">Résolu</option>
                </select>

                <div className={`h-10 flex items-center px-3 rounded-xl border ${borderSoft} ${isDark ? 'bg-gray-800/40' : 'bg-white'}`}>
                  <List size={16} className={muted} />
                  <span className={`ml-2 text-sm ${muted}`}>
                    {filtered.length} message{filtered.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className={`rounded-2xl border ${card} p-5 h-full flex flex-col`}> 
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={18} className={isDark ? 'text-blue-300' : 'text-blue-600'} />
                <h3 className="font-semibold">Répartition</h3>
              </div>

              <div className="flex-1 mt-2">
                <h4 className="text-xs uppercase tracking-widest font-bold mb-3 text-gray-400">Statut</h4>
                {Array.from(stats.byStatut.entries()).map(([k, v]) => (
                  <div key={k} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {STATUT_LABEL[k] ?? k}
                      </span>
                      <span className="text-sm font-bold">{v}</span>
                    </div>
                    {renderBar(v, maxByStatut)}
                  </div>
                ))}

                <h4 className="text-xs uppercase tracking-widest font-bold mt-6 mb-3 text-gray-400">Types</h4>
                {Array.from(stats.byType.entries()).map(([k, v]) => (
                  <div key={k} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {TYPE_LABEL[k] ?? k}
                      </span>
                      <span className="text-sm font-bold">{v}</span>
                    </div>
                    {renderBar(v, maxByType)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="col-span-12 lg:col-span-5">
                <div className={`rounded-2xl border ${card} p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Messages</h3>
                    <span className={`text-xs ${muted}`}>Cliquez pour voir le détail</span>
                  </div>

                  <div className="max-h-[62vh] overflow-y-auto pr-1 space-y-2">
                    {filtered.length === 0 ? (
                      <div className={`py-10 text-center ${muted}`}>Aucun message</div>
                    ) : (
                      filtered.map((m) => {
                        const isActive = m.id === activeId
                        return (
                          <button
                            key={m.id}
                            onClick={() => handleSelectMessage(m.id)}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                              isActive
                                ? 'border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                                : isDark
                                  ? 'border-gray-800 hover:bg-gray-800/50'
                                  : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                      m.statut === 'RESOLU'
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                        : m.statut === 'EN_COURS'
                                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                    }`}
                                  >
                                    {STATUT_LABEL[m.statut] ?? m.statut}
                                  </span>
                                  {!m.lu && (
                                    <span className="text-xs font-bold text-red-600 dark:text-red-400">Non lu</span>
                                  )}
                                </div>
                                <p className="mt-2 text-sm font-semibold truncate">{m.sujet}</p>
                                <p className={`text-xs mt-1 ${muted} truncate`}>
                                  {m.auteur?.nom ?? 'Utilisateur'} · {safeDate(m.dateEnvoi)}
                                </p>
                              </div>

                              <div className={`shrink-0 text-xs ${muted} flex flex-col items-end`}>
                                <span className="font-semibold">{TYPE_LABEL[m.type] ?? m.type}</span>
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
          </div>

          {/* DETAILS */}
          <div className="col-span-12 lg:col-span-7">
                <div className={`rounded-2xl border ${card} p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Détail</h3>
                    {activeMessage?.id ? (
                      <span className={`text-xs ${muted}`}>#{activeMessage.id}</span>
                    ) : (
                      <span className={`text-xs ${muted}`}>—</span>
                    )}
                  </div>

                  {!activeMessage ? (
                    <div className={`py-14 text-center ${muted}`}>Sélectionnez un message</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare
                              size={16}
                              className={isDark ? 'text-blue-300' : 'text-blue-600'}
                            />
                            <h4 className="font-semibold">{activeMessage.sujet}</h4>
                          </div>
                          <span className={`text-xs ${muted}`}>{safeDate(activeMessage.dateEnvoi)}</span>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {TYPE_LABEL[activeMessage.type] ?? activeMessage.type}
                          </span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              activeMessage.statut === 'RESOLU'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : activeMessage.statut === 'EN_COURS'
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}
                          >
                            {STATUT_LABEL[activeMessage.statut] ?? activeMessage.statut}
                          </span>
                          {!activeMessage.lu && (
                            <span className="text-xs font-bold text-red-600 dark:text-red-400">Non lu</span>
                          )}
                        </div>

                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{activeMessage.message}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => updateStatus(activeMessage.id, 'RESOLU')}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                            activeMessage.statut === 'RESOLU' 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500' 
                              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50'
                          }`}
                          disabled={activeMessage.statut === 'RESOLU'}
                        >
                          Marquer comme résolu
                        </button>
                        <button
                          onClick={() => updateStatus(activeMessage.id, 'EN_COURS')}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                            activeMessage.statut === 'EN_COURS' 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500' 
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50'
                          }`}
                          disabled={activeMessage.statut === 'EN_COURS'}
                        >
                          Marquer en cours
                        </button>
                        <button
                          onClick={() => updateStatus(activeMessage.id, 'EN_ATTENTE')}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                            activeMessage.statut === 'EN_ATTENTE' 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500' 
                              : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50'
                          }`}
                          disabled={activeMessage.statut === 'EN_ATTENTE'}
                        >
                          En attente
                        </button>

                        {!activeMessage.lu && (
                          <button
                            onClick={() => markAsRead(activeMessage.id)}
                            className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 ml-auto"
                          >
                            Marquer comme lu
                          </button>
                        )}
                      </div>

                      <div className="rounded-xl border p-4">
                        <h4 className="font-semibold mb-2">Auteur</h4>
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-bold">
                            {(activeMessage.auteur?.nom?.[0] ?? 'U').toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{activeMessage.auteur?.nom ?? '—'}</p>
                            {activeMessage.auteur?.email && <p className={`text-xs ${muted}`}>{activeMessage.auteur.email}</p>}
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border p-4">
                        <h4 className="font-semibold mb-2">Réponse admin</h4>
                        {activeMessage.reponse ? (
                          <>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-xs ${muted}`}>Répondu le {safeDate(activeMessage.dateReponse)}</span>
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{activeMessage.admin?.nom ?? 'Admin'}</span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{activeMessage.reponse}</p>
                          </>
                        ) : (
                          <div className={`text-sm ${muted}`}>Aucune réponse pour le moment.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
          </div>

        </motion.div>
      </div>
    </div>
  )
}


