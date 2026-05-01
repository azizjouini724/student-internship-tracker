import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, Bell, User,
  Settings, HelpCircle, Moon, Sun, LogOut,
  Users, CheckCircle, Clock, TrendingUp,
  ChevronRight, X, Check, XCircle, Calendar, Plus
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

export default function SupervisorDashboard() {
  const { nom, logout } = useAuthStore()
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
  const [deadlineForm, setDeadlineForm] = useState({ type: '', dateLimite: '' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const userId = localStorage.getItem('userId')
      const [rapportsRes, usersRes, deadlinesRes] = await Promise.all([
        api.get('/rapports'),
        api.get('/users'),
        api.get('/deadlines')
      ])
      setRapports(rapportsRes.data)
      setUsers(usersRes.data)
      setDeadlines(deadlinesRes.data)

      if (userId) {
        const demandesRes = await api.get(`/demandes/encadrant/${userId}`)
        setDemandes(demandesRes.data)
      }
    } catch {
      toast.error('Erreur de chargement')
    }
  }

  const handleRepondre = async (demandeId: number, accepte: boolean) => {
    setLoadingAction(demandeId)
    try {
      await api.put(`/demandes/${demandeId}/repondre`, { accepte })
      toast.success(accepte ? '✅ Demande acceptée !' : '❌ Demande refusée')
      fetchData()
    } catch {
      toast.error('Erreur lors de la réponse')
    } finally {
      setLoadingAction(null)
    }
  }

  const createDeadline = async () => {
    if (!deadlineForm.type || !deadlineForm.dateLimite) {
      toast.error('Remplissez tous les champs')
      return
    }
    setLoadingDeadline(true)
    try {
      await api.post('/deadlines', deadlineForm)
      toast.success('Deadline créée !')
      setShowCreateDeadline(false)
      setDeadlineForm({ type: '', dateLimite: '' })
      fetchData()
    } catch {
      toast.error('Erreur création deadline')
    } finally {
      setLoadingDeadline(false)
    }
  }

  // Stats
  const etudiants = users.filter(u => u.role === 'ETUDIANT')
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
      icon: Users,
      label: 'Active Students',
      value: String(etudiants.length).padStart(2, '0'),
      sub: 'Étudiants assignés',
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600',
      border: 'border-l-purple-500'
    },
    {
      icon: CheckCircle,
      label: 'Review Rate',
      value: `${reviewRate}%`,
      sub: 'Rapports validés',
      color: 'text-secondary',
      bg: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-secondary',
      border: 'border-l-secondary'
    },
    {
      icon: Clock,
      label: 'Pending Reviews',
      value: String(enAttente).padStart(2, '0'),
      sub: 'En attente de review',
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600',
      border: 'border-l-amber-500'
    },
    {
      icon: Bell,
      label: 'Demandes',
      value: String(demandesEnAttente.length).padStart(2, '0'),
      sub: 'En attente de réponse',
      color: 'text-primary',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-primary',
      border: 'border-l-primary',
      onClick: () => setShowDemandesModal(true)
    },
  ]

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: FileText, label: 'Reports' },
    { icon: Users, label: 'Students' },
    { icon: Calendar, label: 'Deadlines' },
    { icon: Bell, label: 'Notifications' },
    { icon: User, label: 'Profile' },
  ]

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
          <h1 className="font-bold text-lg tracking-wide" style={{ color: '#421384' }}>
            Dossier Pro
          </h1>
          <p className="text-gray-400 text-xs tracking-widest uppercase mt-0.5">
            Supervisor Portal
          </p>
        </div>

        {/* Role Badge */}
        <div className="mx-2 mb-4 px-3 py-2 rounded-xl text-xs font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
          👨‍💼 Supervisor Mode
        </div>

        {/* Demandes Badge */}
        {demandesEnAttente.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowDemandesModal(true)}
            className="mx-2 mb-4 px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            <span className="text-amber-600 dark:text-amber-400">
              🔔 {demandesEnAttente.length} demande(s) en attente
            </span>
            <ChevronRight className="w-3 h-3 text-amber-500" />
          </motion.button>
        )}

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ icon: Icon, label }) => (
            <motion.button
              key={label}
              whileHover={{ x: 3 }}
              onClick={() => setActiveNav(label)}
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
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
          ))}
        </nav>

        <div className="flex flex-col gap-1 pt-4" style={{ borderTop: '1px solid rgba(66,19,132,0.08)' }}>
          <motion.button whileHover={{ x: 3 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-white transition-all">
            <Settings className="w-4 h-4" />Settings
          </motion.button>
          <motion.button whileHover={{ x: 3 }}
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
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between px-8 py-4 bg-white dark:bg-gray-900"
          style={{ borderBottom: '1px solid rgba(66,19,132,0.06)' }}
        >
          <div className="flex items-center gap-3 bg-purple-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 w-72">
            <span className="text-gray-400 text-sm">🔍</span>
            <input placeholder="Search students or records..."
              className="bg-transparent text-sm text-gray-600 dark:text-gray-100 outline-none w-full placeholder-gray-400 dark:placeholder-gray-500" />
          </div>

          <div className="flex items-center gap-3">

            {/* ADD DEADLINE Button */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateDeadline(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <Calendar className="w-4 h-4" />ADD DEADLINE
            </motion.button>

            {/* Demandes button */}
            {demandesEnAttente.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDemandesModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium relative"
                style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}
              >
                <Bell className="w-4 h-4" />
                DEMANDES
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

            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
              {nom?.charAt(0).toUpperCase() || 'S'}
            </div>
          </div>
        </motion.header>

        {/* CONTENT */}
        <div className="flex-1 p-8 overflow-auto">

          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8"
            style={{ borderTop: '2px solid #421384', paddingTop: '16px' }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
              Welcome back, {nom?.split(' ')[0] || 'Supervisor'}.
            </h2>
            <p className="text-gray-400 dark:text-gray-300 mt-1 text-sm">
              Managing{' '}
              <span className="font-semibold" style={{ color: '#421384' }}>
                {etudiants.length} active
              </span>{' '}
              internships.
              {demandesEnAttente.length > 0 && (
                <span className="text-amber-500 font-semibold">
                  {' '}{demandesEnAttente.length} demande(s) d'encadrement en attente.
                </span>
              )}
            </p>
          </motion.div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {statCards.map(({ icon: Icon, label, value, sub, color, bg, iconColor, border, onClick }: any, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                onClick={onClick}
                className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border-l-4 ${border} shadow-sm ${onClick ? 'cursor-pointer' : ''}`}
              >
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-300 tracking-widest uppercase mb-1">{label}</p>
                <p className={`text-3xl font-bold ${color} mb-1`} style={{ letterSpacing: '-0.02em' }}>
                  {value}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-300">{sub}</p>
              </motion.div>
            ))}
          </div>

          {/* CHARTS */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Reports Overview</h3>
              <p className="text-xs text-gray-400 dark:text-gray-300 mb-6">Distribution par statut</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{
                    background: tooltipBg, border: 'none',
                    borderRadius: '12px', fontSize: '12px',
                    color: isDark ? '#fff' : '#111'
                  }} />
                  <Bar dataKey="value" fill="#421384" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Review Progress</h3>
              <p className="text-xs text-gray-400 dark:text-gray-300 mb-6">Rapports reçus vs validés</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{
                    background: tooltipBg, border: 'none',
                    borderRadius: '12px', fontSize: '12px',
                    color: isDark ? '#fff' : '#111'
                  }} />
                  <Legend formatter={(value) => (
                    <span style={{ fontSize: '11px', color: axisColor }}>{value}</span>
                  )} />
                  <Line type="monotone" dataKey="rapports" stroke="#421384" strokeWidth={2.5}
                    dot={{ fill: '#421384', r: 4 }} name="Reçus" />
                  <Line type="monotone" dataKey="validés" stroke="#006c48" strokeWidth={2.5}
                    dot={{ fill: '#006c48', r: 4 }} name="Validés" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* BOTTOM ROW — Pending + Students + Deadlines */}
          <div className="grid grid-cols-3 gap-4">

            {/* Pending Reports */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm"
            >
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
                    <motion.div
                      key={rapport.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-gray-800"
                      style={{ borderLeft: '3px solid #421384' }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                          {rapport.titre?.charAt(0) || 'R'}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-800 dark:text-white">{rapport.titre}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-300">
                            {rapport.dateDepot
                              ? new Date(rapport.dateDepot).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                              : '—'}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        REVIEW
                      </span>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Students Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm"
            >
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
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #421384, #6d28d9)' }}
                          />
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </motion.div>

            {/* Deadlines */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Deadlines</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">Dates limites</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateDeadline(true)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto">
                {deadlines.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20 text-gray-400" />
                    <p className="text-sm text-gray-400 dark:text-gray-300">Aucune deadline</p>
                    <button
                      onClick={() => setShowCreateDeadline(true)}
                      className="mt-2 text-xs font-medium hover:opacity-70 transition-opacity"
                      style={{ color: '#421384' }}
                    >
                      + Ajouter une deadline
                    </button>
                  </div>
                ) : (
                  deadlines.map((deadline, i) => (
                    <motion.div
                      key={deadline.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className="p-3 rounded-xl"
                      style={{
                        background: 'rgba(66,19,132,0.05)',
                        borderLeft: '3px solid #421384'
                      }}
                    >
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{deadline.type}</p>
                      <p className="text-xs mt-1" style={{ color: '#421384' }}>
                        📅 {new Date(deadline.dateLimite).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* MODAL DEMANDES */}
      <AnimatePresence>
        {showDemandesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowDemandesModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    Demandes d'Encadrement
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">
                    {demandesEnAttente.length} demande(s) en attente de réponse
                  </p>
                </div>
                <button
                  onClick={() => setShowDemandesModal(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
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
                    <motion.div
                      key={demande.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800"
                      style={{ borderLeft: `3px solid ${
                        demande.statut === 'ACCEPTE' ? '#006c48'
                        : demande.statut === 'REFUSE' ? '#ef4444'
                        : '#421384'
                      }` }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                            style={{ background: 'linear-gradient(135deg, #142588, #303f9f)' }}>
                            {demande.etudiant?.nom?.charAt(0) || 'E'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                              {demande.etudiant?.nom}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-300">
                              {demande.etudiant?.email}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          demande.statut === 'ACCEPTE'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : demande.statut === 'REFUSE'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {demande.statut === 'ACCEPTE' ? '✅ Acceptée'
                            : demande.statut === 'REFUSE' ? '❌ Refusée'
                            : '⏳ En attente'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 rounded-lg p-3 mb-3 italic">
                        "{demande.message}"
                      </p>

                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                        📅 {new Date(demande.dateDemande).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })}
                      </p>

                      {demande.statut === 'EN_ATTENTE' && (
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleRepondre(demande.id, true)}
                            disabled={loadingAction === demande.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-semibold disabled:opacity-70"
                            style={{ background: 'linear-gradient(135deg, #006c48, #059669)' }}
                          >
                            {loadingAction === demande.id ? (
                              <motion.div animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                            ) : (
                              <><Check className="w-3.5 h-3.5" />ACCEPTER</>
                            )}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleRepondre(demande.id, false)}
                            disabled={loadingAction === demande.id}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-xs font-semibold disabled:opacity-70"
                            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
                          >
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

      {/* MODAL CREATE DEADLINE */}
      <AnimatePresence>
        {showCreateDeadline && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowCreateDeadline(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Nouvelle Deadline</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">Pour vos étudiants</p>
                </div>
                <button onClick={() => setShowCreateDeadline(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mb-4">
                <label className="text-xs text-gray-400 dark:text-gray-300 tracking-widest uppercase mb-2 block">
                  Type de deadline
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rapport final, Soutenance..."
                  value={deadlineForm.type}
                  onChange={e => setDeadlineForm({ ...deadlineForm, type: e.target.value })}
                  className="w-full bg-purple-50 dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-3 rounded-xl border-b-2 border-transparent focus:border-purple-600 outline-none text-sm transition-all"
                />
              </div>

              <div className="mb-6">
                <label className="text-xs text-gray-400 dark:text-gray-300 tracking-widest uppercase mb-2 block">
                  Date limite
                </label>
                <input
                  type="date"
                  value={deadlineForm.dateLimite}
                  onChange={e => setDeadlineForm({ ...deadlineForm, dateLimite: e.target.value })}
                  className="w-full bg-purple-50 dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-3 rounded-xl border-b-2 border-transparent focus:border-purple-600 outline-none text-sm transition-all"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={createDeadline}
                disabled={loadingDeadline}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}
              >
                {loadingDeadline ? (
                  <motion.div animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <><Calendar className="w-4 h-4" />CRÉER LA DEADLINE</>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}