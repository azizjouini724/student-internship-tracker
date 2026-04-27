import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, Bell, User,
  Settings, HelpCircle, Moon, Sun, LogOut,
  Users, CheckCircle, Clock, TrendingUp,
  ChevronRight
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
  const [activeNav, setActiveNav] = useState('Dashboard')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [rapportsRes, usersRes] = await Promise.all([
        api.get('/rapports'),
        api.get('/users')
      ])
      setRapports(rapportsRes.data)
      setUsers(usersRes.data)
    } catch {
      toast.error('Erreur de chargement')
    }
  }

  // Stats
  const etudiants = users.filter(u => u.role === 'ETUDIANT')
  const totalRapports = rapports.length
  const valides = rapports.filter(r => r.statut === 'VALIDE').length
  const enAttente = rapports.filter(r => r.statut === 'SOUMIS').length
  const reviewRate = totalRapports > 0 ? Math.round((valides / totalRapports) * 100) : 0

  const axisColor = isDark ? '#e5e7eb' : '#9ca3af'
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,37,136,0.06)'
  const tooltipBg = isDark ? '#1f2937' : '#ffffff'

  // Bar chart data
  const barData = [
    { name: 'Soumis', value: rapports.filter(r => r.statut === 'SOUMIS').length, fill: '#142588' },
    { name: 'Validé', value: rapports.filter(r => r.statut === 'VALIDE').length, fill: '#006c48' },
    { name: 'Rejeté', value: rapports.filter(r => r.statut === 'REJETE').length, fill: '#ef4444' },
  ]

  // Line chart data
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
      color: 'text-tertiary',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-tertiary',
      border: 'border-l-tertiary'
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
      icon: TrendingUp,
      label: 'Total Reports',
      value: String(totalRapports).padStart(2, '0'),
      sub: 'Tous les rapports',
      color: 'text-primary',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-primary',
      border: 'border-l-primary'
    },
  ]

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: FileText, label: 'Reports' },
    { icon: Users, label: 'Students' },
    { icon: Bell, label: 'Notifications' },
    { icon: User, label: 'Profile' },
  ]

  const getStatutColor = (statut: string) => {
    if (statut === 'VALIDE') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    if (statut === 'REJETE') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
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
        <div className="mb-10 px-2">
          <h1 className="font-bold text-lg tracking-wide" style={{ color: '#421384' }}>
            Dossier Pro
          </h1>
          <p className="text-gray-400 dark:text-gray-400 text-xs tracking-widest uppercase mt-0.5">
            Supervisor Portal
          </p>
        </div>

        {/* Role Badge */}
        <div className="mx-2 mb-6 px-3 py-2 rounded-xl text-xs font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
          👨‍💼 Supervisor Mode
        </div>

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
            <div className="text-right mr-2">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {nom || 'Supervisor'}
              </p>
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
              Managing <span className="font-semibold" style={{ color: '#421384' }}>{etudiants.length} active</span> internships.
              {enAttente > 0 && <span className="text-amber-500 font-semibold"> {enAttente} reports require your review today.</span>}
            </p>
          </motion.div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {statCards.map(({ icon: Icon, label, value, sub, color, bg, iconColor, border }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border-l-4 ${border} shadow-sm`}
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

          {/* CHARTS ROW */}
          <div className="grid grid-cols-2 gap-4 mb-8">

            {/* Bar Chart */}
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
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Bar key={index} dataKey="value" fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Line Chart */}
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

          {/* PENDING REVIEWS */}
          <div className="grid grid-cols-3 gap-4">

            {/* Pending list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Pending Reviews</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">
                    Signature required for weekly dossier submissions
                  </p>
                </div>
                <button className="text-sm font-medium hover:opacity-70 transition-opacity"
                  style={{ color: '#421384' }}>
                  View All →
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {rapports.filter(r => r.statut === 'SOUMIS').length === 0 ? (
                  <div className="text-center py-10">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-20 text-green-500" />
                    <p className="text-sm font-medium text-gray-400 dark:text-gray-300">
                      All caught up! No pending reviews.
                    </p>
                  </div>
                ) : (
                  rapports.filter(r => r.statut === 'SOUMIS').slice(0, 4).map((rapport, i) => (
                    <motion.div
                      key={rapport.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ x: 2 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-purple-50/50 dark:bg-gray-800 cursor-pointer transition-all"
                      style={{ borderLeft: '3px solid #421384' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: 'linear-gradient(135deg, #421384, #6d28d9)' }}>
                          {rapport.titre?.charAt(0) || 'R'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">{rapport.titre}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">
                            {rapport.dateDepot
                              ? new Date(rapport.dateDepot).toLocaleDateString('fr-FR', {
                                  day: 'numeric', month: 'short'
                                })
                              : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          NEEDS REVIEW
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                          style={{ background: '#006c48' }}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Students List */}
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
                  etudiants.slice(0, 4).map((etudiant, i) => {
                    const etudiantRapports = rapports.filter(r => r.auteur?.id === etudiant.id)
                    const progress = etudiantRapports.length > 0
                      ? Math.round((etudiantRapports.filter(r => r.statut === 'VALIDE').length / etudiantRapports.length) * 100)
                      : 0

                    return (
                      <motion.div
                        key={etudiant.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                              style={{ background: 'linear-gradient(135deg, #142588, #303f9f)' }}>
                              {etudiant.nom?.charAt(0) || 'E'}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-800 dark:text-white">{etudiant.nom}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold text-primary">{progress}%</span>
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ delay: i * 0.1 + 0.3, duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ background: 'linear-gradient(90deg, #142588, #303f9f)' }}
                          />
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}