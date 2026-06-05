import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, CheckCheck, X, Info, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import api, { notificationAPI } from '../services/api'

// ─── Type ─────────────────────────────────────────────────────────────────────
interface Notification {
  id: number
  message: string
  titre?: string
  estLue: boolean    // ← le vrai nom du champ
  createdAt?: string
  dateEnvoi?: string
  type?: string      // [NEW] Type de notification (RETARD_DEPOT, etc)
}

interface NotificationBellProps {
  isDark?: boolean
}

// ─── Composant ────────────────────────────────────────────────────────────────
export default function NotificationBell({ isDark = false }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [retardsCount, setRetardsCount] = useState(0)  // [NEW] Compter les retards
  const [open, setOpen]                   = useState(false)
  const [loading, setLoading]             = useState(false)
  const dropdownRef                       = useRef<HTMLDivElement>(null)
  const userId                            = localStorage.getItem('userId')

  const unreadCount = notifications.filter(n => !n.estLue).length

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchNotifications = async () => {
    if (!userId) return
    try {
      setLoading(true)
      const res = await api.get(`/notifications/user/${userId}`)
      const sorted = [...res.data].sort((a: Notification, b: Notification) => {
        if (a.estLue !== b.estLue) return a.estLue ? 1 : -1
        const dateA = new Date(a.dateEnvoi ?? a.createdAt ?? 0).getTime()
        const dateB = new Date(b.dateEnvoi ?? b.createdAt ?? 0).getTime()
        return dateB - dateA
      })
      setNotifications(sorted)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  // [NEW] Fetch retards count
  const fetchRetardsCount = async () => {
    if (!userId) return
    try {
      const res = await notificationAPI.countRetards(userId)
      setRetardsCount(res.data || 0)
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    fetchNotifications()
    fetchRetardsCount()  // [NEW]
    const interval = setInterval(() => {
      fetchNotifications()
      fetchRetardsCount()  // [NEW]
    }, 30000)
    return () => clearInterval(interval)
  }, [userId])

  // ── Fermer si clic extérieur ────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // [FIXED] Marquer une notif comme lue
  const markAsRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await api.put(`/notifications/${id}/lire`)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, estLue: true } : n)
      )
    } catch (err: any) {
      if (err?.response?.status === 403) {
        toast.error('Session expirée — reconnectez-vous')
      } else {
        toast.error('Erreur lors de la mise à jour')
      }
    }
  }

  // [FIXED] Tout marquer comme lu
  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.estLue)
    if (unread.length === 0) return
    try {
      const results = await Promise.allSettled(
        unread.map(n => api.put(`/notifications/${n.id}/lire`))
      )

      const success = results.filter(r => r.status === 'fulfilled')
      const failed  = results.filter(r => r.status === 'rejected')

      if (success.length > 0) {
        const successIds = unread
          .filter((_, i) => results[i].status === 'fulfilled')
          .map(n => n.id)
        setNotifications(prev =>
          prev.map(n => successIds.includes(n.id) ? { ...n, estLue: true } : n)
        )
      }

      if (failed.length === 0) {
        toast.success('Toutes les notifications marquées comme lues')
      } else if (success.length > 0) {
        toast.success(`${success.length} notification(s) marquées comme lues`)
      } else {
        toast.error('Erreur — vérifiez votre connexion et reconnectez-vous')
      }
    } catch {
      toast.error('Erreur réseau')
    }
  }

  // ── Format date ─────────────────────────────────────────────────────────────
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now  = new Date()
    const diff = now.getTime() - date.getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days  = Math.floor(diff / 86400000)

    if (mins < 1)   return 'A l\'instant'
    if (mins < 60)  return `Il y a ${mins} min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days < 7)   return `Il y a ${days}j`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  // [NEW] Retourner l'icône et couleur selon le type
  const getNotificationIcon = (type?: string) => {
    if (type === 'RETARD_DEPOT') {
      return { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/40' }
    }
    return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/40' }
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const dropBg     = isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
  const itemHover  = isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
  const itemUnread = isDark ? 'bg-blue-900/20 border-l-blue-500' : 'bg-blue-50 border-l-blue-400'
  const itemRead   = isDark ? 'border-l-gray-700' : 'border-l-gray-200'
  const textSub    = isDark ? 'text-gray-400' : 'text-gray-500'
  const textMain   = isDark ? 'text-gray-100' : 'text-gray-800'

  // [NEW] Compter total badges (notifications non lues + retards)
  const totalBadge = unreadCount + (retardsCount > 0 ? 1 : 0)

  return (
    <div className="relative" ref={dropdownRef}>

      {/* ── Bouton cloche ────────────────────────────────────────────────── */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(prev => !prev)}
        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
          isDark
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
        } ${open ? (isDark ? 'bg-gray-700' : 'bg-gray-200') : ''}`}
      >
        <motion.div
          animate={totalBadge > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
        >
          <Bell className="w-4 h-4" />
        </motion.div>

        {/* Badge général */}
        <AnimatePresence>
          {totalBadge > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-md"
            >
              {totalBadge > 9 ? '9+' : totalBadge}
            </motion.span>
          )}
        </AnimatePresence>

        {/* [NEW] Badge spécial retards (orange) */}
        <AnimatePresence>
          {retardsCount > 0 && (
            <motion.span
              key="retards-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse border border-orange-600"
              title={`${retardsCount} retard(s) de depot`}
            >
              [!]
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ── Dropdown ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute right-0 top-11 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden ${dropBg}`}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold">Notifications</span>
                {totalBadge > 0 && (
                  <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold">
                    {totalBadge}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-gray-800 text-blue-400' : 'hover:bg-blue-50 text-blue-600'
                    }`}
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Tout lire
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="max-h-80 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"
                  />
                </div>

              ) : notifications.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-10 ${textSub}`}>
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">Aucune notification</p>
                  <p className="text-xs mt-1 opacity-70">Vous êtes a jour !</p>
                </div>

              ) : (
                notifications.slice(0, 10).map((notif, i) => {
                  const { icon: IconComp, color, bg } = getNotificationIcon(notif.type)
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-start gap-3 px-4 py-3 border-l-4 border-b transition-colors cursor-default ${
                        notif.estLue ? `${itemRead} ${itemHover}` : `${itemUnread} ${itemHover}`
                      } ${isDark ? 'border-b-gray-800' : 'border-b-gray-50'}`}
                    >
                      {/* Icône */}
                      <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                        notif.estLue
                          ? isDark ? 'bg-gray-700' : 'bg-gray-100'
                          : bg
                      }`}>
                        <IconComp className={`w-3.5 h-3.5 ${notif.estLue ? textSub : color}`} />
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        {notif.titre && (
                          <p className={`text-xs font-semibold mb-0.5 ${notif.estLue ? textSub : textMain}`}>
                            {notif.titre}
                          </p>
                        )}
                        <p className={`text-xs leading-relaxed ${notif.estLue ? textSub : textMain}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Clock className={`w-3 h-3 ${textSub}`} />
                          <span className={`text-[10px] ${textSub}`}>
                            {formatDate(notif.dateEnvoi ?? notif.createdAt)}
                          </span>
                          {!notif.estLue && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-1 animate-pulse" />
                          )}
                        </div>
                      </div>

                      {/* Bouton marquer lu */}
                      {!notif.estLue && (
                        <button
                          onClick={(e) => markAsRead(notif.id, e)}
                          className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
                            isDark
                              ? 'hover:bg-gray-700 text-gray-400 hover:text-green-400'
                              : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                          }`}
                          title="Marquer comme lu"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </motion.div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className={`px-4 py-2.5 border-t text-center ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <button
                  onClick={() => {
                    setOpen(false)
                    window.location.href = '/notifications'
                  }}
                  className={`text-xs font-medium transition-colors ${
                    isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  Voir toutes les notifications ({notifications.length})
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}