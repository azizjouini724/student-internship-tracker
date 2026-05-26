import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, Bell, User,
  Settings, HelpCircle, Moon, Sun, LogOut,
  Users, CheckCircle, Clock, TrendingUp,
  ChevronRight, X, Check, XCircle, Calendar, Plus, Search, Briefcase, MessageCircle,
  CalendarDays, ChevronLeft, ChevronRight as ChevronRightIcon, AlertTriangle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart,
  Line, Legend
} from 'recharts'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../hooks/useTheme'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import api from '../services/api'
import NotificationBell from '../components/NotificationBell'

// ─── Calendar Helper ──────────────────────────────────────────────────────────
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate()
const getFirstDayOfMonth = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay()
  return day === 0 ? 6 : day - 1 // Monday = 0
}

const formatDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function SupervisorDashboard() {
  const { nom, logout, photoUrl } = useAuthStore()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [rapports, setRapports] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [demandes, setDemandes] = useState<any[]>([])
  const [deadlines, setDeadlines] = useState<any[]>([])
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [showDemandesModal, setShowDemandesModal] = useState(false)
  const [showCreateDeadline, setShowCreateDeadline] = useState(false)
  const [loadingAction, setLoadingAction] = useState<number | null>(null)
  const [loadingDeadline, setLoadingDeadline] = useState(false)
  const [deadlineForm, setDeadlineForm] = useState({ type: '', dateLimite: '', description: '' })

  // ── Calendar state ────────────────────────────────────────────────────────
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth())

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

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) return
      const [rapportsRes, etudiantsRes, deadlinesRes] = await Promise.all([
        api.get('/rapports'),
        api.get('/users/encadrant/' + userId + '/etudiants'),
        api.get('/deadlines/encadrant/' + userId)
      ])
      setRapports(rapportsRes.data)
      setUsers(etudiantsRes.data)
      setDeadlines(deadlinesRes.data)
      const demandesRes = await api.get(`/demandes/encadrant/${userId}`)
      setDemandes(demandesRes.data)
    } catch {
      toast.error('Erreur de chargement')
    }
  }

  const handleRepondre = async (demandeId: number, accepte: boolean) => {
    setLoadingAction(demandeId)
    try {
      await api.put(`/demandes/${demandeId}/repondre`, { accepte })
      toast.success(accepte ? 'Demande acceptée !' : 'Demande refusée')
      fetchData()
    } catch {
      toast.error('Erreur lors de la réponse')
    } finally {
      setLoadingAction(null)
    }
  }

  // ── Vérifier la limite AVANT d'ouvrir le modal ──────────────────────────
  const checkAndOpenDeadlineModal = async () => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) return
      const res = await api.get(`/deadlines/encadrant/${userId}`)
      const allDeadlines = res.data

      const now = new Date()
      const day = now.getDay()
      const diffToMonday = day === 0 ? -6 : 1 - day
      const debutSemaine = new Date(now)
      debutSemaine.setDate(now.getDate() + diffToMonday)
      debutSemaine.setHours(0, 0, 0, 0)

      const createdThisWeek = allDeadlines.filter((d: any) => {
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
        setDeadlineForm({ type: '', dateLimite: '', description: '' })
        setCalYear(new Date().getFullYear())
        setCalMonth(new Date().getMonth())
        setShowCreateDeadline(true)
      }
    } catch {
      setDeadlineForm({ type: '', dateLimite: '', description: '' })
      setCalYear(new Date().getFullYear())
      setCalMonth(new Date().getMonth())
      setShowCreateDeadline(true)
    }
  }

  const createDeadline = async () => {
    if (!deadlineForm.type || !deadlineForm.dateLimite) {
      toast.error('Titre et date requis')
      return
    }
    setLoadingDeadline(true)
    try {
      const userId = localStorage.getItem('userId')
      await api.post('/deadlines', {
        type: deadlineForm.type,
        dateLimite: deadlineForm.dateLimite,
        description: deadlineForm.description,
        encadrantId: userId
      })
      toast.success('Deadline créée ! Vos étudiants seront notifiés.')
      setShowCreateDeadline(false)
      setDeadlineForm({ type: '', dateLimite: '', description: '' })
      fetchData()
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
        setShowCreateDeadline(false)
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setLoadingDeadline(false)
    }
  }

  const etudiants = users
  const totalRapports = rapports.length
  const valides = rapports.filter(r => r.statut === 'VALIDE').length
  const enAttente = rapports.filter(r => r.statut === 'SOUMIS').length
  const reviewRate = totalRapports > 0 ? Math.round((valides / totalRapports) * 100) : 0
  const demandesEnAttente = demandes.filter(d => d.statut === 'EN_ATTENTE')

  const axisColor = isDark ? '#e5e7eb' : '#9ca3af'
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,37,136,0.06)'
  const tooltipBg = isDark ? '#1f2937' : '#ffffff'

  const barData = [
    { name: 'Soumis', value: rapports.filter(r => r.statut === 'SOUMIS').length },
    { name: 'Validé', value: rapports.filter(r => r.statut === 'VALIDE').length },
    { name: 'Rejeté', value: rapports.filter(r => r.statut === 'REJETE').length },
  ]

  const lineData = rapports.slice(-6).map((r, i) => ({
    name: `W${i + 1}`,
    rapports: i + 1,
    validés: r.statut === 'VALIDE' ? i + 1 : Math.floor(i * 0.7),
  }))

  const statCards = [
    {
      icon: Users, label: 'Active Students',
      value: String(etudiants.length).padStart(2, '0'),
      sub: 'Étudiants assignés',
      color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600', border: 'border-l-purple-500'
    },
    {
      icon: CheckCircle, label: 'Review Rate',
      value: `${reviewRate}%`,
      sub: 'Rapports validés',
      color: 'text-secondary', bg: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-secondary', border: 'border-l-secondary'
    },
    {
      icon: Clock, label: 'Pending Reviews',
      value: String(enAttente).padStart(2, '0'),
      sub: 'En attente de review',
      color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600', border: 'border-l-amber-500'
    },
    {
      icon: Bell, label: 'Demandes',
      value: String(demandesEnAttente.length).padStart(2, '0'),
      sub: 'En attente de réponse',
      color: 'text-primary', bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-primary', border: 'border-l-primary',
      onClick: () => setShowDemandesModal(true)
    },
  ]

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: null },
    { icon: FileText, label: 'Reports', path: '/supervisor/reports' },
    { icon: Users, label: 'Students', path: '/supervisor/students' },
    { icon: Calendar, label: 'Deadlines', path: '/supervisor/deadlines' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: User, label: 'Profile', path: '/profile' },
  ]

  const handleNavClick = (label: string, path: string | null) => {
    setActiveNav(label)
    if (path) navigate(path)
  }

  // ── Calendar rendering ──────────────────────────────────────────────────
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(calYear, calMonth)
    const firstDay = getFirstDayOfMonth(calYear, calMonth)
    const today = new Date()
    const todayStr = formatDateStr(today)
    const selectedDate = deadlineForm.dateLimite

    const prevMonth = () => {
      if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) }
      else setCalMonth(calMonth - 1)
    }
    const nextMonth = () => {
      if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) }
      else setCalMonth(calMonth + 1)
    }

    const cells: React.ReactNode[] = []

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-8" />)
    }

    // Day cells
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
          onClick={() => !isPast && setDeadlineForm(f => ({ ...f, dateLimite: dateStr }))}
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
        {/* Header */}
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
            <ChevronRightIcon size={14} />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS_FR.map(dn => (
            <div key={dn} className={`h-6 flex items-center justify-center text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {dn}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells}
        </div>

        {/* Selected date display */}
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
    <div className="flex min-h-screen bg-surface dark:bg-gray-950 font-sans">
      <Toaster position="top-right" richColors />

      {/* SIDEBAR */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-64 bg-white dark:bg-gray-900 flex flex-col py-8 px-5"
        style={{ borderRight: '1px solid rgba(66,19,132,0.08)' }}
      >
        <div className="mb-6 px-2">
          <h1 className="font-bold text-lg tracking-wide" style={{ color: '#421384' }}>Dossier Pro</h1>
          <p className="text-gray-400 text-xs tracking-widest uppercase mt-0.5">Supervisor Portal</p>
        </div>

        <div className="mx-2 mb-4 px-3 py-2 rounded-xl text-xs font-medium text-white flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
          <Briefcase size={14} /> Supervisor Mode
        </div>

        {demandesEnAttente.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setShowDemandesModal(true)}
            className="mx-2 mb-4 px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Bell size={13} /> {demandesEnAttente.length} demande(s) en attente
            </span>
            <ChevronRight className="w-3 h-3 text-amber-500" />
          </motion.button>
        )}

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ icon: Icon, label, path }) => (
            <motion.button key={label} whileHover={{ x: 3 }}
              onClick={() => handleNavClick(label, path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeNav === label
                  ? 'text-white shadow-lg'
                  : 'text-gray-500 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-800 hover:text-purple-700 dark:hover:text-white'
              }`}
              style={activeNav === label ? {
                background: 'linear-gradient(135deg, #421384, #6d28d9)',
                boxShadow: '0 4px 15px rgba(66,19,132,0.3)'
              } : {}}
            >
              <Icon className="w-4 h-4" />{label}
            </motion.button>
          ))}
        </nav>

        <div className="flex flex-col gap-1 pt-4" style={{ borderTop: '1px solid rgba(66,19,132,0.08)' }}>
          <motion.button whileHover={{ x: 3 }} onClick={() => navigate('/settings')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white transition-all">
            <Settings className="w-4 h-4" />Settings
          </motion.button>
          <motion.button whileHover={{ x: 3 }} onClick={() => navigate('/support')}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white transition-all">
            <HelpCircle className="w-4 h-4" />Support
          </motion.button>
          <motion.button whileHover={{ x: 3 }} onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
            <LogOut className="w-4 h-4" />Logout
          </motion.button>
        </div>
      </motion.aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* TOPBAR */}
        <motion.header
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-8 py-4 bg-white dark:bg-gray-900"
          style={{ borderBottom: '1px solid rgba(66,19,132,0.06)' }}
        >
          <div className="flex items-center gap-3 bg-purple-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 w-72">
            <Search size={16} className="text-gray-400" />
            <input placeholder="Search students or records..."
              className="bg-transparent text-sm text-gray-600 dark:text-gray-100 outline-none w-full placeholder-gray-400 dark:placeholder-gray-500" />
          </div>

          <div className="flex items-center gap-3">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => checkAndOpenDeadlineModal()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Calendar className="w-4 h-4" />ADD DEADLINE
            </motion.button>

            {demandesEnAttente.length > 0 && (
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowDemandesModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium relative"
                style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                <Bell className="w-4 h-4" />DEMANDES
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                  {demandesEnAttente.length}
                </span>
              </motion.button>
            )}

            <div className="text-right mr-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{nom || 'Supervisor'}</p>
              <p className="text-xs text-gray-400 dark:text-gray-300">Senior Supervisor</p>
            </div>

            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>
            <NotificationBell isDark={isDark} />
            {(() => {
              const photo = localStorage.getItem('photoUrl')
              return photo ? (
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate('/profile')}
                  className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-purple-400/30">
                  <img src={photo} alt="avatar" className="w-full h-full object-cover" />
                </motion.button>
              ) : (
                <motion.button whileHover={{ scale: 1.05 }} onClick={() => navigate('/profile')}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                  {nom?.charAt(0).toUpperCase() || 'S'}
                </motion.button>
              )
            })()}
          </div>
        </motion.header>

        {/* CONTENT */}
        <div className="flex-1 p-8 overflow-auto">

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8" style={{ borderTop: '2px solid #421384', paddingTop: '16px' }}>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
              Welcome back, {nom?.split(' ')[0] || 'Supervisor'}.
            </h2>
            <p className="text-gray-400 dark:text-gray-300 mt-1 text-sm">
              Managing{' '}
              <span className="font-semibold" style={{ color: '#421384' }}>{etudiants.length} active</span> internships.
              {demandesEnAttente.length > 0 && (
                <span className="text-amber-500 font-semibold"> {demandesEnAttente.length} demande(s) d'encadrement en attente.</span>
              )}
            </p>
          </motion.div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {statCards.map(({ icon: Icon, label, value, sub, color, bg, iconColor, border, onClick }: any, i) => (
              <motion.div key={label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                onClick={onClick}
                className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border-l-4 ${border} shadow-sm ${onClick ? 'cursor-pointer' : ''}`}>
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-300 tracking-widest uppercase mb-1">{label}</p>
                <p className={`text-3xl font-bold ${color} mb-1`} style={{ letterSpacing: '-0.02em' }}>{value}</p>
                <p className="text-xs text-gray-400 dark:text-gray-300">{sub}</p>
              </motion.div>
            ))}
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Reports Overview</h3>
              <p className="text-xs text-gray-400 dark:text-gray-300 mb-6">Distribution par statut</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: '12px', fontSize: '12px', color: isDark ? '#fff' : '#111' }} />
                  <Bar dataKey="value" fill="#421384" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Review Progress</h3>
              <p className="text-xs text-gray-400 dark:text-gray-300 mb-6">Rapports reçus vs validés</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: '12px', fontSize: '12px', color: isDark ? '#fff' : '#111' }} />
                  <Legend formatter={(value) => <span style={{ fontSize: '11px', color: axisColor }}>{value}</span>} />
                  <Line type="monotone" dataKey="rapports" stroke="#421384" strokeWidth={2.5} dot={{ fill: '#421384', r: 4 }} name="Reçus" />
                  <Line type="monotone" dataKey="validés" stroke="#006c48" strokeWidth={2.5} dot={{ fill: '#006c48', r: 4 }} name="Validés" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* BOTTOM ROW */}
          <div className="grid grid-cols-3 gap-4">

            {/* Pending Reports */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Pending Reviews</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">Rapports à valider</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {rapports.filter(r => r.statut === 'SOUMIS').length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-20 text-green-500" />
                    <p className="text-sm text-gray-400 dark:text-gray-300">All caught up!</p>
                  </div>
                ) : (
                  rapports.filter(r => r.statut === 'SOUMIS').slice(0, 4).map((rapport, i) => (
                    <motion.div key={rapport.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-gray-800"
                      style={{ borderLeft: '3px solid #421384' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                          {rapport.titre?.charAt(0) || 'R'}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800 dark:text-white">{rapport.titre}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-300">
                            {rapport.dateDepot ? new Date(rapport.dateDepot).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">REVIEW</span>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Students Progress */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Active Students</h3>
              <p className="text-xs text-gray-400 dark:text-gray-300 mb-5">Real-time progress</p>
              <div className="flex flex-col gap-4">
                {etudiants.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-20 text-gray-400" />
                    <p className="text-sm text-gray-400 dark:text-gray-300">No students yet</p>
                  </div>
                ) : (
                  etudiants.slice(0, 5).map((etudiant, i) => {
                    const etudiantRapports = rapports.filter(r => r.auteur?.id === etudiant.id)
                    const progress = etudiantRapports.length > 0
                      ? Math.round((etudiantRapports.filter(r => r.statut === 'VALIDE').length / etudiantRapports.length) * 100)
                      : 0
                    return (
                      <motion.div key={etudiant.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                              style={{ background: 'linear-gradient(135deg, #142588, #303f9f)' }}>
                              {etudiant.nom?.charAt(0) || 'E'}
                            </div>
                            <p className="text-xs font-medium text-gray-800 dark:text-white">{etudiant.nom}</p>
                          </div>
                          <span className="text-xs font-semibold" style={{ color: '#421384' }}>{progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                            transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #421384, #6d28d9)' }} />
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </motion.div>

            {/* Deadlines */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Deadlines</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">Dates limites</p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => checkAndOpenDeadlineModal()}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
                {deadlines.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20 text-gray-400" />
                    <p className="text-sm text-gray-400 dark:text-gray-300">Aucune deadline</p>
                    <button onClick={() => checkAndOpenDeadlineModal()}
                      className="mt-2 text-xs font-medium hover:opacity-70 transition-opacity" style={{ color: '#421384' }}>
                      + Ajouter une deadline
                    </button>
                  </div>
                ) : (
                  deadlines.map((deadline, i) => (
                    <motion.div key={deadline.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
                      className="p-3 rounded-xl"
                      style={{ background: 'rgba(66,19,132,0.05)', borderLeft: '3px solid #421384' }}>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{deadline.type || deadline.titre}</p>
                      <p className="text-xs mt-1" style={{ color: '#421384' }}>
                        📅 {deadline.dateLimite
                          ? new Date(deadline.dateLimite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                          : '—'}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* ══ MODAL DEMANDES ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showDemandesModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowDemandesModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Demandes d'Encadrement</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">{demandesEnAttente.length} demande(s) en attente</p>
                </div>
                <button onClick={() => setShowDemandesModal(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
                {demandes.length === 0 ? (
                  <div className="text-center py-10">
                    <Bell className="w-10 h-10 mx-auto mb-3 opacity-20 text-gray-400" />
                    <p className="text-sm text-gray-400 dark:text-gray-300">Aucune demande reçue</p>
                  </div>
                ) : (
                  demandes.map((demande, i) => (
                    <motion.div key={demande.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800"
                      style={{ borderLeft: `3px solid ${demande.statut === 'ACCEPTE' ? '#006c48' : demande.statut === 'REFUSE' ? '#ef4444' : '#421384'}` }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {photoUrl ? (
                            <img src={photoUrl} alt="avatar"
                              className="w-9 h-9 rounded-xl object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white text-sm font-bold">
                              {nom?.charAt(0).toUpperCase() || 'A'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">{demande.etudiant?.nom}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-300">{demande.etudiant?.email}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          demande.statut === 'ACCEPTE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : demande.statut === 'REFUSE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {demande.statut === 'ACCEPTE' ? <><Check size={12} className="inline mr-1" />Acceptée</>
                            : demande.statut === 'REFUSE' ? <><XCircle size={12} className="inline mr-1" />Refusée</>
                            : <><Clock size={12} className="inline mr-1" />En attente</>}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 rounded-lg p-3 mb-3 italic">"{demande.message}"</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(demande.dateDemande).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      {demande.statut === 'EN_ATTENTE' && (
                        <div className="flex gap-2">
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => handleRepondre(demande.id, true)} disabled={loadingAction === demande.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-semibold disabled:opacity-70"
                            style={{ background: 'linear-gradient(135deg, #006c48, #059669)' }}>
                            {loadingAction === demande.id ? (
                              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                            ) : <><Check className="w-3.5 h-3.5" />ACCEPTER</>}
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={() => handleRepondre(demande.id, false)} disabled={loadingAction === demande.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-semibold disabled:opacity-70"
                            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                            <XCircle className="w-3.5 h-3.5" />REFUSER
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ MODAL CREATE DEADLINE (nouveau design) ════════════════════════════════ */}
      <AnimatePresence>
        {showCreateDeadline && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowCreateDeadline(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header gradient */}
              <div className="px-6 pt-6 pb-4" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(66,19,132,0.08)'}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                      <Plus size={16} className="text-white" />
                    </div>
                    <div>
                      <h3 className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>Nouvelle Deadline</h3>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pour vos étudiants — ils seront notifiés</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCreateDeadline(false)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Titre */}
                <div>
                  <label className={`text-xs font-semibold tracking-wider uppercase mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Titre *
                  </label>
                  <input type="text"
                    placeholder="Ex: Rapport final, Soutenance..."
                    value={deadlineForm.type}
                    onChange={e => setDeadlineForm(f => ({ ...f, type: e.target.value }))}
                    className={`w-full h-10 px-4 rounded-xl text-sm outline-none transition-all ${
                      isDark
                        ? 'bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500'
                        : 'bg-white border border-purple-200 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10'
                    }`}
                  />
                </div>

                {/* Calendrier interactif */}
                <div>
                  <label className={`text-xs font-semibold tracking-wider uppercase mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className="flex items-center gap-1.5"><CalendarDays size={12} /> Date limite *</span>
                  </label>
                  {renderCalendar()}
                </div>

                {/* Description */}
                <div>
                  <label className={`text-xs font-semibold tracking-wider uppercase mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Description
                  </label>
                  <textarea
                    placeholder="Instructions, détails pour les étudiants..."
                    rows={3}
                    value={deadlineForm.description}
                    onChange={e => setDeadlineForm(f => ({ ...f, description: e.target.value }))}
                    className={`w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-all ${
                      isDark
                        ? 'bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 focus:border-purple-500'
                        : 'bg-white border border-purple-200 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10'
                    }`}
                  />
                </div>

                {/* Boutons */}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setShowCreateDeadline(false)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                    Annuler
                  </button>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    onClick={createDeadline} disabled={loadingDeadline}
                    className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                    {loadingDeadline ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : <><Plus size={14} /> Créer la deadline</>}
                  </motion.button>
                </div>
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