import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCheck,
  Clock,
  FileText,
  UserCheck,
  AlertCircle,
  MessageSquare,
  Calendar,
  RefreshCw,
  Loader2,
  Check
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import api from '../services/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Notification {
  id: number
  titre: string
  message: string
  estLue: boolean
  dateEnvoi: string
  type?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getNotifStyle = (notif: Notification) => {
  const titre = (notif.titre || '').toLowerCase()
  const type = notif.type || ''

  if (type === 'RETARD_DEPOT') {
    return {
      icon: AlertCircle,
      from: '#fb923c',
      to: '#ea580c',
      accent: '#f97316'
    }
  }

  if (type === 'DEADLINE_APPROCHE') {
    return {
      icon: Calendar,
      from: '#f59e0b',
      to: '#d97706',
      accent: '#f59e0b'
    }
  }

  if (
    titre.includes('rapport') ||
    titre.includes('soumis') ||
    titre.includes('valide') ||
    titre.includes('rejete')
  ) {
    return {
      icon: FileText,
      from: '#60a5fa',
      to: '#2563eb',
      accent: '#3b82f6'
    }
  }

  if (
    titre.includes('encadrant') ||
    titre.includes('demande') ||
    titre.includes('accepte') ||
    titre.includes('refuse')
  ) {
    return {
      icon: UserCheck,
      from: '#34d399',
      to: '#059669',
      accent: '#10b981'
    }
  }

  if (titre.includes('deadline') || titre.includes('date')) {
    return {
      icon: Calendar,
      from: '#fb923c',
      to: '#ea580c',
      accent: '#f97316'
    }
  }

  if (
    titre.includes('support') ||
    titre.includes('message') ||
    titre.includes('reponse')
  ) {
    return {
      icon: MessageSquare,
      from: '#c084fc',
      to: '#9333ea',
      accent: '#a855f7'
    }
  }

  if (titre.includes('urgent') || titre.includes('important')) {
    return {
      icon: AlertCircle,
      from: '#f87171',
      to: '#dc2626',
      accent: '#ef4444'
    }
  }

  return {
    icon: Bell,
    from: '#9ca3af',
    to: '#4b5563',
    accent: '#6b7280'
  }
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return "A l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  if (hours < 24) return `Il y a ${hours} h`
  if (days < 7) return `Il y a ${days} j`

  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  })
}

const groupNotifs = (notifs: Notification[]) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - 7)

  const groups: { label: string; items: Notification[] }[] = [
    { label: "Aujourd'hui", items: [] },
    { label: 'Cette semaine', items: [] },
    { label: 'Anciennes', items: [] }
  ]

  notifs.forEach((n) => {
    const d = new Date(n.dateEnvoi)
    d.setHours(0, 0, 0, 0)

    if (d >= today) groups[0].items.push(n)
    else if (d >= weekStart) groups[1].items.push(n)
    else groups[2].items.push(n)
  })

  return groups.filter((g) => g.items.length > 0)
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const navigate = useNavigate()
  const isDark = localStorage.getItem('theme') === 'dark'
  const userId = localStorage.getItem('userId')

  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState<number | null>(null)
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'RETARD'>('ALL')

  const fetchNotifs = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await api.get<Notification[]>(`/notifications/user/${userId}`)
      const sorted = [...res.data].sort(
        (a, b) => new Date(b.dateEnvoi).getTime() - new Date(a.dateEnvoi).getTime()
      )
      setNotifs(sorted)
    } catch {
      toast.error('Erreur de chargement des notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifs()
  }, [])

  const marquerLue = async (id: number) => {
    setMarking(id)
    try {
      await api.put(`/notifications/${id}/lire`)
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, estLue: true } : n))
      )
    } catch {
      toast.error('Erreur lors de la mise a jour')
    } finally {
      setMarking(null)
    }
  }

  const marquerToutesLues = async () => {
    const nonLues = notifs.filter((n) => !n.estLue)
    if (!nonLues.length) return

    try {
      await Promise.all(nonLues.map((n) => api.put(`/notifications/${n.id}/lire`)))
      setNotifs((prev) => prev.map((n) => ({ ...n, estLue: true })))
      toast.success('Toutes les notifications ont ete marquees comme lues')
    } catch {
      toast.error('Erreur lors de la mise a jour')
    }
  }

  const nonLuesCount = notifs.filter((n) => !n.estLue).length
  const retardCount = notifs.filter((n) => n.type === 'RETARD_DEPOT').length

  const displayed =
    filter === 'UNREAD'
      ? notifs.filter((n) => !n.estLue)
      : filter === 'RETARD'
      ? notifs.filter((n) => n.type === 'RETARD_DEPOT')
      : notifs

  const grouped = groupNotifs(displayed)

  const emptyTitle =
    filter === 'UNREAD'
      ? 'Aucune notification non lue'
      : filter === 'RETARD'
      ? 'Aucun retard de depot'
      : 'Aucune notification'

  const emptyText =
    filter === 'RETARD'
      ? 'Les notifications de retard apparaitront ici.'
      : 'Vous serez notifie des activites importantes ici.'

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0f1117] text-gray-100' : 'bg-[#f5f6fa] text-gray-900'}`}>
      <Toaster position="top-right" richColors />

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-6 ${isDark ? 'bg-[#1a1d27]' : 'bg-white'}`}
          style={{
            boxShadow: isDark
              ? '0 4px 24px rgba(0,0,0,0.3)'
              : '0 4px 24px rgba(0,0,0,0.06)'
          }}
        >
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => {
                const role = localStorage.getItem('role')
                if (role === 'ENCADRANT') navigate('/supervisor')
                else if (role === 'ADMIN') navigate('/admin')
                else navigate('/student')
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isDark
                  ? 'bg-[#252836] hover:bg-[#2d3142] text-gray-400'
                  : 'bg-[#f0f2ff] hover:bg-[#e0e3ff] text-blue-600'
              }`}
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchNotifs}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isDark
                    ? 'bg-[#252836] hover:bg-[#2d3142] text-gray-400'
                    : 'bg-[#f0f2ff] hover:bg-[#e0e3ff] text-blue-600'
                }`}
              >
                <RefreshCw size={18} />
              </button>

              {nonLuesCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={marquerToutesLues}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                >
                  <CheckCheck size={16} />
                  Tout marquer lu
                </motion.button>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            Vous avez{' '}
            <span className="text-blue-500 font-semibold">
              {nonLuesCount} notification{nonLuesCount !== 1 ? 's' : ''}
            </span>{' '}
            non lue{nonLuesCount !== 1 ? 's' : ''}.
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <div
          className={`flex flex-wrap gap-2 p-1.5 rounded-xl ${isDark ? 'bg-[#1a1d27]' : 'bg-white'}`}
          style={{
            boxShadow: isDark
              ? '0 2px 12px rgba(0,0,0,0.2)'
              : '0 2px 12px rgba(0,0,0,0.04)'
          }}
        >
          <button
            onClick={() => setFilter('ALL')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : isDark
                ? 'text-gray-400 hover:text-gray-200 hover:bg-[#252836]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Bell size={16} />
            Toutes
          </button>

          <button
            onClick={() => setFilter('UNREAD')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              filter === 'UNREAD'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : isDark
                ? 'text-gray-400 hover:text-gray-200 hover:bg-[#252836]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CheckCheck size={16} />
            Non lues
            {nonLuesCount > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-md ${
                  filter === 'UNREAD'
                    ? 'bg-white/20'
                    : isDark
                    ? 'bg-[#252836] text-blue-400'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                {nonLuesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter('RETARD')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              filter === 'RETARD'
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : isDark
                ? 'text-gray-400 hover:text-gray-200 hover:bg-[#252836]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <AlertCircle size={16} />
            Retards
            {retardCount > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-md ${
                  filter === 'RETARD'
                    ? 'bg-white/20'
                    : isDark
                    ? 'bg-[#252836] text-orange-400'
                    : 'bg-orange-100 text-orange-600'
                }`}
              >
                {retardCount}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        ) : grouped.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-2xl p-16 text-center ${isDark ? 'bg-[#1a1d27]' : 'bg-white'}`}
            style={{
              boxShadow: isDark
                ? '0 2px 16px rgba(0,0,0,0.2)'
                : '0 2px 16px rgba(0,0,0,0.06)'
            }}
          >
            <div
              className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                isDark ? 'bg-[#252836]' : 'bg-[#f0f2ff]'
              }`}
            >
              <BellOff size={28} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
            </div>
            <p className="text-base font-semibold mb-1">{emptyTitle}</p>
            <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              {emptyText}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {grouped.map((group, gi) => (
              <div key={group.label}>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: gi * 0.1 }}
                  className="flex items-center gap-3 mb-4"
                >
                  <h2 className="text-sm font-bold tracking-wide uppercase">
                    {group.label}
                  </h2>
                  <div className={`flex-1 h-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
                  <span className={`text-xs font-medium ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {group.items.length}
                  </span>
                </motion.div>

                <div className="flex flex-col gap-3">
                  {group.items.map((notif, i) => {
                    const { icon: Icon, from, to, accent } = getNotifStyle(notif)

                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: gi * 0.1 + i * 0.05 }}
                        className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer ${
                          isDark ? 'bg-[#1a1d27] hover:bg-[#1e2130]' : 'bg-white hover:bg-gray-50'
                        }`}
                        style={{
                          boxShadow: isDark
                            ? '0 2px 12px rgba(0,0,0,0.2)'
                            : '0 2px 12px rgba(0,0,0,0.06)',
                          borderLeft: !notif.estLue
                            ? `3px solid ${accent}`
                            : '3px solid transparent'
                        }}
                        onClick={() => {
                          if (!notif.estLue) marquerLue(notif.id)
                        }}
                      >
                        {!notif.estLue && (
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              background: accent,
                              flexShrink: 0,
                              boxShadow: `0 0 8px ${accent}60`
                            }}
                          />
                        )}

                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 16,
                            background: `linear-gradient(135deg, ${from}, ${to})`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <Icon size={22} style={{ color: 'white' }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-bold ${
                              notif.estLue ? (isDark ? 'text-gray-500' : 'text-gray-400') : ''
                            }`}
                            style={{ color: !notif.estLue ? accent : undefined }}
                          >
                            {notif.titre}
                          </p>

                          <p className={`text-sm mt-0.5 line-clamp-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {notif.message}
                          </p>

                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            <Clock size={10} className="inline mr-1" />
                            {timeAgo(notif.dateEnvoi)}
                          </p>
                        </div>

                        <div className="shrink-0">
                          {!notif.estLue ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                marquerLue(notif.id)
                              }}
                              disabled={marking === notif.id}
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 14,
                                background: `${accent}15`,
                                border: `1.5px solid ${accent}30`,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: accent,
                                transition: 'all 0.2s'
                              }}
                            >
                              {marking === notif.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Check size={14} />
                              )}
                            </button>
                          ) : (
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 14,
                                background: isDark ? '#252836' : '#f0f2ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <CheckCheck size={14} style={{ color: '#10b981' }} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}