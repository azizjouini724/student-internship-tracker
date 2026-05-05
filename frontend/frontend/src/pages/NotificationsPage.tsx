import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Bell, BellOff, CheckCheck,
  Clock, FileText, UserCheck, AlertCircle,
  MessageSquare, Calendar, RefreshCw, Loader2,
  SlidersHorizontal, Check
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getNotifStyle = (titre: string) => {
  const t = titre.toLowerCase()
  if (t.includes('rapport') || t.includes('soumis') || t.includes('validé') || t.includes('rejeté'))
    return { icon: FileText,    gradient: 'from-blue-400 to-blue-600',    accent: '#3b82f6' }
  if (t.includes('encadrant') || t.includes('demande') || t.includes('accepté') || t.includes('refusé'))
    return { icon: UserCheck,   gradient: 'from-emerald-400 to-emerald-600', accent: '#10b981' }
  if (t.includes('deadline') || t.includes('date'))
    return { icon: Calendar,    gradient: 'from-orange-400 to-orange-600', accent: '#f97316' }
  if (t.includes('support') || t.includes('message') || t.includes('réponse'))
    return { icon: MessageSquare, gradient: 'from-purple-400 to-purple-600', accent: '#a855f7' }
  if (t.includes('urgent') || t.includes('important'))
    return { icon: AlertCircle, gradient: 'from-red-400 to-red-600',      accent: '#ef4444' }
  return { icon: Bell,          gradient: 'from-gray-400 to-gray-600',    accent: '#6b7280' }
}

const timeAgo = (dateStr: string) => {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return "À l'instant"
  if (mins < 60)  return `${mins} min ago`
  if (hours < 24) return `${hours} h ago`
  if (days < 7)   return `${days} June`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const groupNotifs = (notifs: Notification[]) => {
  const today     = new Date(); today.setHours(0,0,0,0)
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - 7)

  const groups: { label: string; items: Notification[] }[] = [
    { label: 'Today',     items: [] },
    { label: 'This Week', items: [] },
    { label: 'Older',     items: [] },
  ]

  notifs.forEach(n => {
    const d = new Date(n.dateEnvoi); d.setHours(0,0,0,0)
    if (d >= today)       groups[0].items.push(n)
    else if (d >= weekStart) groups[1].items.push(n)
    else                  groups[2].items.push(n)
  })

  return groups.filter(g => g.items.length > 0)
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const navigate = useNavigate()
  const isDark   = localStorage.getItem('theme') === 'dark'
  const userId   = localStorage.getItem('userId')

  const [notifs,   setNotifs]   = useState<Notification[]>([])
  const [loading,  setLoading]  = useState(true)
  const [marking,  setMarking]  = useState<number | null>(null)
  const [filter,   setFilter]   = useState<'ALL' | 'UNREAD'>('ALL')
  const [showFilter, setShowFilter] = useState(false)

  const fetchNotifs = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await api.get<Notification[]>(`/notifications/user/${userId}`)
      const sorted = res.data.sort((a, b) =>
        new Date(b.dateEnvoi).getTime() - new Date(a.dateEnvoi).getTime()
      )
      setNotifs(sorted)
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifs() }, [])

  const marquerLue = async (id: number) => {
    setMarking(id)
    try {
      await api.put(`/notifications/${id}/lire`)
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, estLue: true } : n))
    } catch { toast.error('Erreur') }
    finally { setMarking(null) }
  }

  const marquerToutesLues = async () => {
    const nonLues = notifs.filter(n => !n.estLue)
    if (!nonLues.length) return
    try {
      await Promise.all(nonLues.map(n => api.put(`/notifications/${n.id}/lire`)))
      setNotifs(prev => prev.map(n => ({ ...n, estLue: true })))
      toast.success('Toutes marquées comme lues !')
    } catch { toast.error('Erreur') }
  }

  const nonLuesCount = notifs.filter(n => !n.estLue).length
  const displayed    = filter === 'UNREAD' ? notifs.filter(n => !n.estLue) : notifs
  const grouped      = groupNotifs(displayed)

  const bg     = isDark ? '#0f1117' : '#f5f6fa'
  const cardBg = isDark ? '#1a1d27' : '#ffffff'
  const muted  = isDark ? '#6b7280' : '#9ca3af'

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'system-ui, sans-serif' }}
      className={isDark ? 'text-gray-100' : 'text-gray-900'}>
      <Toaster position="top-right" richColors />

      {/* ── Page container ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 80px' }}>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: cardBg,
            borderRadius: '0 0 28px 28px',
            padding: '56px 24px 28px',
            boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,0,0,0.06)',
            marginBottom: 24,
          }}
        >
          {/* Back + filter */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button onClick={() => navigate('/student')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: muted }}>
              <ArrowLeft size={20} />
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowFilter(!showFilter)}
                style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: isDark ? '#252836' : '#f0f2ff',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#3b82f6',
                }}>
                <SlidersHorizontal size={18} />
              </button>
            </div>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Notifications
          </h1>
          <p style={{ fontSize: 14, color: muted, margin: 0 }}>
            You have{' '}
            <span style={{ color: '#3b82f6', fontWeight: 600 }}>
              {nonLuesCount} Notification{nonLuesCount !== 1 ? 's' : ''}
            </span>{' '}
            today.
          </p>

          {/* Filter dropdown */}
          <AnimatePresence>
            {showFilter && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', marginTop: 16 }}
              >
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['ALL', 'UNREAD'] as const).map(f => (
                    <button key={f} onClick={() => { setFilter(f); setShowFilter(false) }}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 10, border: 'none',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        background: filter === f ? '#3b82f6' : isDark ? '#252836' : '#f0f2ff',
                        color: filter === f ? 'white' : muted,
                        transition: 'all 0.2s',
                      }}>
                      {f === 'ALL' ? 'Toutes' : '🔴 Non lues'}
                    </button>
                  ))}
                  {nonLuesCount > 0 && (
                    <button onClick={() => { marquerToutesLues(); setShowFilter(false) }}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 10, border: 'none',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        background: isDark ? '#252836' : '#f0f2ff', color: '#10b981',
                      }}>
                      <CheckCheck size={13} style={{ display: 'inline', marginRight: 4 }} />
                      Tout lu
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Content ───────────────────────────────────────────────────────── */}
        <div style={{ padding: '0 16px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
              <Loader2 size={28} className="animate-spin" style={{ color: '#3b82f6' }} />
            </div>
          ) : grouped.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                textAlign: 'center', padding: '60px 24px',
                background: cardBg, borderRadius: 24,
                boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.2)' : '0 2px 16px rgba(0,0,0,0.06)',
              }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
                background: isDark ? '#252836' : '#f0f2ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BellOff size={28} style={{ color: muted }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>
                {filter === 'UNREAD' ? 'Aucune notification non lue' : 'Aucune notification'}
              </p>
              <p style={{ fontSize: 13, color: muted, margin: 0 }}>
                Vous serez notifié des activités importantes ici.
              </p>
            </motion.div>
          ) : (
            grouped.map((group, gi) => (
              <div key={group.label} style={{ marginBottom: 24 }}>
                {/* Group label */}
                <motion.p
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: gi * 0.1 }}
                  style={{
                    fontSize: 16, fontWeight: 700,
                    margin: '0 0 12px 4px',
                    color: isDark ? '#e5e7eb' : '#111827',
                  }}
                >
                  {group.label}
                </motion.p>

                {/* Notif cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {group.items.map((notif, i) => {
                    const { icon: Icon, gradient, accent } = getNotifStyle(notif.titre)
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: gi * 0.1 + i * 0.06 }}
                        style={{
                          background: cardBg,
                          borderRadius: 20,
                          padding: '16px',
                          boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.2)' : '0 2px 12px rgba(0,0,0,0.06)',
                          display: 'flex', alignItems: 'center', gap: 14,
                          position: 'relative',
                          borderLeft: !notif.estLue ? `3px solid ${accent}` : '3px solid transparent',
                          transition: 'all 0.2s',
                        }}
                      >
                        {/* Point non lu */}
                        {!notif.estLue && (
                          <span style={{
                            position: 'absolute', top: 16, left: -8,
                            width: 10, height: 10, borderRadius: '50%',
                            background: accent,
                            boxShadow: `0 0 0 3px ${cardBg}`,
                          }} />
                        )}

                        {/* Avatar / Icône */}
                        <div style={{
                          width: 48, height: 48, borderRadius: 16, 
                          background: `linear-gradient(135deg, ${gradient.split(' ')[1]}, ${gradient.split(' ')[3]})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon size={22} style={{ color: 'white' }} />
                        </div>

                        {/* Texte */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: 13, fontWeight: !notif.estLue ? 700 : 500,
                            margin: '0 0 3px',
                            color: isDark ? '#f3f4f6' : '#111827',
                            opacity: notif.estLue ? 0.7 : 1,
                          }}>
                            <span style={{ fontWeight: 700, color: accent }}>
                              {notif.titre}
                            </span>
                          </p>
                          <p style={{
                            fontSize: 12, color: muted, margin: '0 0 4px',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {notif.message}
                          </p>
                          <p style={{ fontSize: 11, color: muted, margin: 0 }}>
                            {timeAgo(notif.dateEnvoi)}
                          </p>
                        </div>

                        {/* Thumbnail / Action */}
                        <div style={{ flexShrink: 0 }}>
                          {!notif.estLue ? (
                            <button
                              onClick={() => marquerLue(notif.id)}
                              disabled={marking === notif.id}
                              style={{
                                width: 36, height: 36, borderRadius: 12,
                                background: `${accent}20`,
                                border: `1.5px solid ${accent}40`,
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: accent,
                                transition: 'all 0.2s',
                              }}
                            >
                              {marking === notif.id
                                ? <Loader2 size={14} className="animate-spin" />
                                : <Check size={14} />
                              }
                            </button>
                          ) : (
                            <div style={{
                              width: 36, height: 36, borderRadius: 12,
                              background: isDark ? '#252836' : '#f0f2ff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <CheckCheck size={14} style={{ color: '#10b981' }} />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}