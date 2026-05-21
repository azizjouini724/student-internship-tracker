import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Search, X, Send, Users, User,
  Loader2, MessageCircle, Check, CheckCheck,
  Phone, Mail, Bell, Plus
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import api from '../services/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface UserInfo {
  id: number
  nom: string
  email?: string
  photoUrl?: string
  telephone?: string
  ville?: string
  role?: string
}

interface Message {
  id: number
  contenu: string
  dateEnvoi: string
  estLu: boolean
  conversationId: string
  expediteur: UserInfo
  destinataire: UserInfo
}

interface Conversation {
  user: UserInfo
  lastMessage: Message | null
  nonLus: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes}min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days < 7) return `Il y a ${days}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MessagesPage() {
  const navigate = useNavigate()
  const isDark = localStorage.getItem('theme') === 'dark'
  const userId = Number(localStorage.getItem('userId'))
  const userNom = localStorage.getItem('nom') ?? 'Utilisateur'
  const userRole = localStorage.getItem('role') ?? ''

  // ── Data ───────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)

  // ── UI state ───────────────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null)
  const [search, setSearch] = useState('')
  const [messageText, setMessageText] = useState('')
  const [showSendAll, setShowSendAll] = useState(false)
  const [sendAllText, setSendAllText] = useState('')
  const [sendingAll, setSendingAll] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ── Styles ─────────────────────────────────────────────────────────────
  const bg = isDark ? 'bg-gray-950' : 'bg-gray-50'
  const input = isDark
    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500'
    : 'bg-white border-purple-200 text-gray-900 placeholder-gray-400 focus:border-purple-500'
  const muted = isDark ? 'text-gray-400' : 'text-gray-500'

  // ── Fetch conversations ────────────────────────────────────────────────
  const fetchConversations = async () => {
    setLoading(true)
    try {
      // 1) Charger les messages existants
      const convRes = await api.get<Message[]>(`/messages/conversations/${userId}`)

      // 2) Charger les contacts selon le rôle
      let contacts: UserInfo[] = []

      if (userRole === 'ENCADRANT') {
        // L'encadrant voit tous ses étudiants
        try {
          const res = await api.get<any[]>(`/users/encadrant/${userId}/etudiants`)
          contacts = res.data.map((u: any) => ({
            id: u.id,
            nom: u.nom,
            email: u.email,
            photoUrl: u.photoUrl,
            telephone: u.telephone,
            ville: u.ville,
            role: u.role
          }))
        } catch { /* silently fail */ }
      } else {
        // L'étudiant voit son encadrant accepté
        try {
          const demRes = await api.get<any[]>(`/demandes/etudiant/${userId}`)
          const acceptee = demRes.data.find((d: any) => d.statut === 'ACCEPTE')
          if (acceptee?.encadrant) {
            contacts.push({
              id: acceptee.encadrant.id,
              nom: acceptee.encadrant.nom,
              email: acceptee.encadrant.email,
              photoUrl: acceptee.encadrant.photoUrl,
              role: 'ENCADRANT'
            })
          }
        } catch { /* silently fail */ }
      }

      // 3) Construire les conversations
      const convMap = new Map<number, { lastMessage: Message | null; nonLus: number }>()

      // Remplir avec les messages existants
      convRes.data.forEach((msg: Message) => {
        const otherUser = msg.expediteur.id === userId ? msg.destinataire : msg.expediteur
        const existing = convMap.get(otherUser.id)
        if (!existing || (msg.dateEnvoi > (existing.lastMessage?.dateEnvoi ?? ''))) {
          convMap.set(otherUser.id, {
            lastMessage: msg,
            nonLus: existing?.nonLus ?? (msg.destinataire.id === userId && !msg.estLu ? 1 : 0)
          })
        } else if (msg.destinataire.id === userId && !msg.estLu) {
          existing.nonLus++
        }
      })

      // 4) Construire la liste finale
      const convList: Conversation[] = []
      const addedIds = new Set<number>()

      // D'abord les conversations avec messages
      convRes.data.forEach((msg: Message) => {
        const otherUser = msg.expediteur.id === userId ? msg.destinataire : msg.expediteur
        if (!addedIds.has(otherUser.id)) {
          const data = convMap.get(otherUser.id)!
          convList.push({ user: otherUser, ...data })
          addedIds.add(otherUser.id)
        }
      })

      // Ensuite les contacts sans messages
      contacts.forEach(contact => {
        if (!addedIds.has(contact.id)) {
          convList.push({ user: contact, lastMessage: null, nonLus: 0 })
          addedIds.add(contact.id)
        }
      })

      // Trier : conversations avec messages en premier
      convList.sort((a, b) => {
        if (a.lastMessage && b.lastMessage) {
          return b.lastMessage.dateEnvoi.localeCompare(a.lastMessage.dateEnvoi)
        }
        if (a.lastMessage) return -1
        if (b.lastMessage) return 1
        return a.user.nom.localeCompare(b.user.nom)
      })

      setConversations(convList)
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  // ── Fetch messages d'une conversation ──────────────────────────────────
  const fetchMessages = async (otherUserId: number) => {
    setLoadingMessages(true)
    try {
      const res = await api.get<Message[]>(`/messages/conversation`, {
        params: { userId1: userId, userId2: otherUserId }
      })
      setMessages(res.data)
      // Marquer comme lu
      await api.put('/messages/lu', {
        userId1: userId,
        userId2: otherUserId,
        currentUserId: userId
      })
      // Rafraîchir les conversations pour mettre à jour les non-lus
      fetchConversations()
    } catch {
      toast.error('Erreur chargement messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  // ── Ouvrir une conversation ───────────────────────────────────────────
  const openConversation = (user: UserInfo) => {
    setSelectedUser(user)
    setMobileShowChat(true)
    fetchMessages(user.id)
  }

  // ── Envoyer un message ────────────────────────────────────────────────
  const handleSend = async () => {
    if (!messageText.trim() || !selectedUser) return
    setSending(true)
    try {
      await api.post('/messages', {
        expediteurId: userId,
        destinataireId: selectedUser.id,
        contenu: messageText.trim()
      })
      setMessageText('')
      fetchMessages(selectedUser.id)
    } catch {
      toast.error('Erreur envoi message')
    } finally {
      setSending(false)
    }
  }

  // ── Envoyer à tous ────────────────────────────────────────────────────
  const handleSendAll = async () => {
    if (!sendAllText.trim()) return
    setSendingAll(true)
    try {
      await api.post('/messages/tous', {
        encadrantId: userId,
        contenu: sendAllText.trim()
      })
      toast.success('Message envoyé à tous les étudiants !')
      setSendAllText('')
      setShowSendAll(false)
      if (selectedUser) fetchMessages(selectedUser.id)
      fetchConversations()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur envoi groupé')
    } finally {
      setSendingAll(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Filtrer conversations ──────────────────────────────────────────────
  const filteredConvs = conversations.filter(c =>
    c.user.nom.toLowerCase().includes(search.toLowerCase())
  )

  const totalNonLus = conversations.reduce((sum, c) => sum + c.nonLus, 0)

  const goBack = () => {
    const role = localStorage.getItem('role')
    if (role === 'ENCADRANT') navigate('/supervisor')
    else if (role === 'ADMIN') navigate('/admin')
    else navigate('/student')
  }

  return (
    <div className={`min-h-screen ${bg} ${isDark ? 'text-gray-100' : 'text-gray-900'} font-sans`}>
      <Toaster position="top-right" richColors />

      <div className="flex h-screen">

        {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
        <div className={`w-full md:w-96 flex flex-col border-r ${
          isDark ? 'border-gray-800 bg-gray-900' : 'border-purple-100 bg-white'
        } ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>

          {/* Header */}
          <div className={`px-5 py-4 border-b ${isDark ? 'border-gray-800' : 'border-purple-100'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <button onClick={goBack}
                  className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-purple-50 text-gray-500'}`}>
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-lg font-bold flex items-center gap-2">
                    <MessageCircle size={18} className="text-purple-600" />
                    Messages
                  </h1>
                  {totalNonLus > 0 && (
                    <p className="text-xs text-purple-600 font-semibold">{totalNonLus} non lu{totalNonLus > 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
              {userRole === 'ENCADRANT' && conversations.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSendAll(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-white"
                  style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                  <Users size={14} /> Tous
                </motion.button>
              )}
            </div>

            {/* Search */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-purple-50'}`}>
              <Search size={14} className={muted} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="flex-1 text-sm bg-transparent outline-none" />
              {search && <button onClick={() => setSearch('')}><X size={13} className={muted} /></button>}
            </div>
          </div>

          {/* Conversations list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-purple-500" />
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className={`text-center py-16 ${muted}`}>
                <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun contact disponible</p>
                <p className="text-xs mt-1">Les contacts apparaîtront ici automatiquement</p>
              </div>
            ) : (
              filteredConvs.map((conv, i) => (
                <motion.button key={conv.user.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => openConversation(conv.user)}
                  className={`w-full text-left px-5 py-4 border-b transition-all ${
                    selectedUser?.id === conv.user.id
                      ? isDark ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200'
                      : isDark ? 'border-gray-800 hover:bg-gray-800/50' : 'border-purple-50 hover:bg-purple-50/50'
                  }`}>
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: conv.user.role === 'ENCADRANT' 
                          ? 'linear-gradient(135deg, #059669, #10b981)' 
                          : 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                        {conv.user.photoUrl ? (
                          <img src={conv.user.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          conv.user.nom.charAt(0).toUpperCase()
                        )}
                      </div>
                      {conv.nonLus > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                          {conv.nonLus}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold truncate">{conv.user.nom}</p>
                        {conv.lastMessage && (
                          <span className={`text-[10px] ${muted}`}>
                            {formatDate(conv.lastMessage.dateEnvoi)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          {conv.lastMessage.expediteur.id === userId && (
                            conv.lastMessage.estLu ? <CheckCheck size={12} className="text-purple-500 shrink-0" /> : <Check size={12} className={muted + ' shrink-0'} />
                          )}
                          <p className={`text-xs truncate ${conv.nonLus > 0 ? 'font-semibold text-gray-700 dark:text-gray-200' : muted}`}>
                            {conv.lastMessage.expediteur.id === userId ? 'Vous : ' : ''}{conv.lastMessage.contenu}
                          </p>
                        </div>
                      ) : (
                        <p className={`text-xs ${muted} mt-0.5`}>Démarrer une conversation</p>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* ══ CHAT AREA ══════════════════════════════════════════════════════ */}
        <div className={`flex-1 flex flex-col ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>

          {!selectedUser ? (
            <div className={`flex-1 flex items-center justify-center ${muted}`}>
              <div className="text-center">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'linear-gradient(135deg, rgba(66,19,132,0.1), rgba(109,40,217,0.1))' }}>
                  <MessageCircle size={36} className="text-purple-500" />
                </div>
                <p className="font-semibold text-lg mb-1">Vos messages</p>
                <p className="text-sm">Sélectionnez un contact pour commencer</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className={`px-6 py-4 border-b flex items-center gap-4 ${
                isDark ? 'border-gray-800 bg-gray-900' : 'border-purple-100 bg-white'
              }`}>
                <button onClick={() => { setSelectedUser(null); setMobileShowChat(false) }}
                  className="md:hidden p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-800">
                  <ArrowLeft size={18} />
                </button>

                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                  style={{ background: selectedUser.role === 'ENCADRANT'
                    ? 'linear-gradient(135deg, #059669, #10b981)' 
                    : 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                  {selectedUser.photoUrl ? (
                    <img src={selectedUser.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    selectedUser.nom.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="font-bold text-sm truncate">{selectedUser.nom}</h2>
                  <p className={`text-xs ${muted} truncate`}>
                    {selectedUser.role === 'ENCADRANT' ? '👨‍💼 Encadrant' : '🎓 Étudiant'}
                    {selectedUser.email ? ` · ${selectedUser.email}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {selectedUser.telephone && (
                    <a href={`tel:${selectedUser.telephone}`}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-purple-50 text-gray-500'}`}>
                      <Phone size={16} />
                    </a>
                  )}
                  <a href={`mailto:${selectedUser.email}`}
                    className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-purple-50 text-gray-500'}`}>
                    <Mail size={16} />
                  </a>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
                style={{ background: isDark ? 'rgba(17,24,39,0.5)' : 'rgba(245,243,255,0.5)' }}>

                {loadingMessages ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 size={24} className="animate-spin text-purple-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className={`text-center py-16 ${muted}`}>
                    <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Pas encore de messages</p>
                    <p className="text-xs mt-1">Envoyez le premier message !</p>
                  </div>
                ) : (
                  messages.map((msg, i) => {
                    const isMine = msg.expediteur.id === userId
                    return (
                      <motion.div key={msg.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>

                        {!isMine && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2 mt-auto"
                            style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                            {selectedUser.nom.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className={`max-w-[70%] ${isMine ? 'order-1' : ''}`}>
                          <div className={`px-4 py-2.5 rounded-2xl ${
                            isMine
                              ? 'text-white rounded-br-md'
                              : isDark ? 'bg-gray-800 text-gray-100 rounded-bl-md' : 'bg-white text-gray-900 border border-purple-100 rounded-bl-md'
                          }`}
                          style={isMine ? { background: 'linear-gradient(135deg, #421384, #6d28d9)' } : {}}>
                            <p className="text-sm leading-relaxed">{msg.contenu}</p>
                          </div>
                          <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                            <span className={`text-[10px] ${muted}`}>{formatTime(msg.dateEnvoi)}</span>
                            {isMine && (
                              msg.estLu ? <CheckCheck size={12} className="text-purple-500" /> : <Check size={12} className={muted} />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-800 bg-gray-900' : 'border-purple-100 bg-white'}`}>
                <div className="flex items-center gap-2">
                  <input
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder="Écrire un message..."
                    className={`flex-1 px-4 py-3 rounded-xl border text-sm outline-none transition-all ${input}`}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={sending || !messageText.trim()}
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white disabled:opacity-50 shrink-0"
                    style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </motion.button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══ MODAL Envoyer à tous ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showSendAll && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
            onClick={() => setShowSendAll(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 28 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              onClick={e => e.stopPropagation()}>

              <div className="px-6 pt-6 pb-4"
                style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(66,19,132,0.08)'}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                      <Users size={16} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base">Envoyer à tous</h2>
                      <p className={`text-xs ${muted}`}>
                        Message groupé à vos étudiants
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setShowSendAll(false)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className={`text-xs font-semibold tracking-wider uppercase mb-1.5 block ${muted}`}>
                    Votre message *
                  </label>
                  <textarea
                    value={sendAllText}
                    onChange={e => setSendAllText(e.target.value)}
                    placeholder="Bonjour à tous, n'oubliez pas la deadline du..."
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl text-sm outline-none resize-none transition-all ${input}`}
                  />
                </div>

                <div className={`flex items-start gap-2 text-xs px-3 py-2.5 rounded-xl ${isDark ? 'bg-amber-900/20 text-amber-400' : 'bg-amber-50 text-amber-700'}`}>
                  <Bell size={13} className="mt-0.5 shrink-0" />
                  Chaque étudiant recevra ce message + une notification.
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setShowSendAll(false)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                    Annuler
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSendAll} disabled={sendingAll || !sendAllText.trim()}
                    className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                    {sendingAll ? <Loader2 size={15} className="animate-spin" /> : <><Send size={14} /> Envoyer</>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}