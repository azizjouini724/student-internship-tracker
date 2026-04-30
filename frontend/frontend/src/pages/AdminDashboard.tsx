import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, FileText, Bell,
  Settings, HelpCircle, Moon, Sun, LogOut,
  Plus, X, Shield, GraduationCap, UserCheck,
  TrendingUp, Calendar, Check
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart,
  Pie, Cell, Legend
} from 'recharts'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../hooks/useTheme'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import api from '../services/api'

const COLORS = ['#142588', '#421384', '#006c48', '#f59e0b']

export default function AdminDashboard() {
  const { nom, logout } = useAuthStore()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [users, setUsers] = useState<any[]>([])
  const [rapports, setRapports] = useState<any[]>([])
  const [deadlines, setDeadlines] = useState<any[]>([])
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showCreateDeadline, setShowCreateDeadline] = useState(false)
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [userForm, setUserForm] = useState({
    nom: '', email: '', password: '', role: 'ETUDIANT'
  })
  const [deadlineForm, setDeadlineForm] = useState({
    type: '', dateLimite: ''
  })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [usersRes, rapportsRes, deadlinesRes] = await Promise.all([
        api.get('/users'),
        api.get('/rapports'),
        api.get('/deadlines')
      ])
      setUsers(usersRes.data)
      setRapports(rapportsRes.data)
      setDeadlines(deadlinesRes.data)
    } catch {
      toast.error('Erreur de chargement')
    }
  }

  const createUser = async () => {
    if (!userForm.nom || !userForm.email || !userForm.password) {
      toast.error('Remplissez tous les champs')
      return
    }
    setLoadingCreate(true)
    try {
      await api.post('/auth/register', userForm)
      toast.success(`Compte ${userForm.role} créé pour ${userForm.nom} !`)
      setShowCreateUser(false)
      setUserForm({ nom: '', email: '', password: '', role: 'ETUDIANT' })
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur création compte')
    } finally {
      setLoadingCreate(false)
    }
  }

  const createDeadline = async () => {
    if (!deadlineForm.type || !deadlineForm.dateLimite) {
      toast.error('Remplissez tous les champs')
      return
    }
    setLoadingCreate(true)
    try {
      await api.post('/deadlines', deadlineForm)
      toast.success('Deadline créée !')
      setShowCreateDeadline(false)
      setDeadlineForm({ type: '', dateLimite: '' })
      fetchData()
    } catch {
      toast.error('Erreur création deadline')
    } finally {
      setLoadingCreate(false)
    }
  }

  const deleteUser = async (id: number) => {
    try {
      await api.delete(`/users/${id}`)
      toast.success('Utilisateur supprimé')
      fetchData()
    } catch {
      toast.error('Erreur suppression')
    }
  }

  // Stats
  const etudiants = users.filter(u => u.role === 'ETUDIANT')
  const encadrants = users.filter(u => u.role === 'ENCADRANT')
  const admins = users.filter(u => u.role === 'ADMIN')
  const totalRapports = rapports.length
  const valides = rapports.filter(r => r.statut === 'VALIDE').length
  const globalProgress = totalRapports > 0 ? Math.round((valides / totalRapports) * 100) : 0

  const axisColor = isDark ? '#e5e7eb' : '#9ca3af'
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,37,136,0.06)'
  const tooltipBg = isDark ? '#1f2937' : '#ffffff'

  const pieData = [
    { name: 'Étudiants', value: etudiants.length },
    { name: 'Encadrants', value: encadrants.length },
    { name: 'Admins', value: admins.length },
  ].filter(d => d.value > 0)

  const barData = [
    { name: 'Soumis', value: rapports.filter(r => r.statut === 'SOUMIS').length },
    { name: 'Validé', value: rapports.filter(r => r.statut === 'VALIDE').length },
    { name: 'Rejeté', value: rapports.filter(r => r.statut === 'REJETE').length },
  ]

  const statCards = [
    {
      icon: Users,
      label: 'Total Users',
      value: String(users.length).padStart(2, '0'),
      sub: `${etudiants.length} étudiants · ${encadrants.length} encadrants`,
      color: 'text-primary',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-primary',
      border: 'border-l-primary'
    },
    {
      icon: GraduationCap,
      label: 'Étudiants',
      value: String(etudiants.length).padStart(2, '0'),
      sub: 'Comptes étudiants actifs',
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600',
      border: 'border-l-purple-500'
    },
    {
      icon: TrendingUp,
      label: 'Global Progress',
      value: `${globalProgress}%`,
      sub: 'Rapports validés / total',
      color: 'text-secondary',
      bg: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-secondary',
      border: 'border-l-secondary'
    },
    {
      icon: Calendar,
      label: 'Deadlines',
      value: String(deadlines.length).padStart(2, '0'),
      sub: 'Deadlines actives',
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600',
      border: 'border-l-amber-500'
    },
  ]

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Users, label: 'Users' },
    { icon: FileText, label: 'Reports' },
    { icon: Calendar, label: 'Deadlines' },
    { icon: Bell, label: 'Notifications' },
  ]

  const getRoleBadge = (role: string) => {
    if (role === 'ETUDIANT') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    if (role === 'ENCADRANT') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  }

  const getRoleIcon = (role: string) => {
    if (role === 'ETUDIANT') return '🎓'
    if (role === 'ENCADRANT') return '👨‍💼'
    return '🔧'
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
        style={{ borderRight: '1px solid rgba(20,37,136,0.06)' }}
      >
        <div className="mb-6 px-2">
          <h1 className="text-primary font-bold text-lg tracking-wide">Dossier Pro</h1>
          <p className="text-gray-400 text-xs tracking-widest uppercase mt-0.5">Admin Portal</p>
        </div>

        {/* Admin Badge */}
        <div className="mx-2 mb-6 px-3 py-2 rounded-xl text-xs font-medium text-white"
          style={{ background: 'linear-gradient(135deg, #0d1e25, #23333a)' }}>
          🔧 Admin Mode
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ icon: Icon, label }) => (
            <motion.button
              key={label}
              whileHover={{ x: 3 }}
              onClick={() => setActiveNav(label)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeNav === label
                  ? 'bg-gray-900 dark:bg-gray-700 text-white shadow-lg'
                  : 'text-gray-500 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
          ))}
        </nav>

        <div className="flex flex-col gap-1 pt-4" style={{ borderTop: '1px solid rgba(20,37,136,0.06)' }}>
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
          style={{ borderBottom: '1px solid rgba(20,37,136,0.06)' }}
        >
          <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 w-72">
            <span className="text-gray-400 text-sm">🔍</span>
            <input placeholder="Search users, reports..."
              className="bg-transparent text-sm text-gray-600 dark:text-gray-100 outline-none w-full placeholder-gray-400 dark:placeholder-gray-500" />
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateUser(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: 'linear-gradient(135deg, #0d1e25, #23333a)' }}
            >
              <Plus className="w-4 h-4" />CREATE USER
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateDeadline(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
            >
              <Calendar className="w-4 h-4" />ADD DEADLINE
            </motion.button>

            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white text-sm font-bold">
              {nom?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </motion.header>

        {/* CONTENT */}
        <div className="flex-1 p-8 overflow-auto">

          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8"
            style={{ borderTop: '2px solid #23333a', paddingTop: '16px' }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
              Admin Control Center
            </h2>
            <p className="text-gray-400 dark:text-gray-300 mt-1 text-sm">
              Managing <span className="font-semibold text-gray-700 dark:text-white">{users.length} users</span> across the platform.
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

          {/* CHARTS */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Reports Overview</h3>
              <p className="text-xs text-gray-400 dark:text-gray-300 mb-6">Statut global des rapports</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barSize={50}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{
                    background: tooltipBg, border: 'none',
                    borderRadius: '12px', fontSize: '12px',
                    color: isDark ? '#fff' : '#111'
                  }} />
                  <Bar dataKey="value" fill="#142588" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">User Distribution</h3>
              <p className="text-xs text-gray-400 dark:text-gray-300 mb-4">Répartition des rôles</p>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{
                    background: tooltipBg, border: 'none',
                    borderRadius: '12px', fontSize: '12px',
                    color: isDark ? '#fff' : '#111'
                  }} />
                  <Legend iconType="circle" iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: '11px', color: axisColor }}>{value}</span>
                    )} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* USERS TABLE + DEADLINES */}
          <div className="grid grid-cols-3 gap-4">

            {/* Users List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">All Users</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">
                    {users.length} utilisateurs enregistrés
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateUser(true)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-white text-xs font-medium"
                  style={{ background: 'linear-gradient(135deg, #142588, #303f9f)' }}
                >
                  <Plus className="w-3 h-3" />Add User
                </motion.button>
              </div>

              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                {users.map((user, i) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {user.nom?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{user.nom}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-300">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${getRoleBadge(user.role)}`}>
                        {getRoleIcon(user.role)} {user.role}
                      </span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => deleteUser(user.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                      >
                        <X className="w-3 h-3" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Deadlines */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Deadlines</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">Dates limites</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateDeadline(true)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ background: '#f59e0b' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </motion.button>
              </div>

              <div className="flex flex-col gap-3 max-h-72 overflow-y-auto">
                {deadlines.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20 text-gray-400" />
                    <p className="text-sm text-gray-400 dark:text-gray-300">Aucune deadline</p>
                  </div>
                ) : (
                  deadlines.map((deadline, i) => (
                    <motion.div
                      key={deadline.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10"
                      style={{ borderLeft: '3px solid #f59e0b' }}
                    >
                      <p className="text-sm font-medium text-gray-800 dark:text-white">{deadline.type}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
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

      {/* MODAL CREATE USER */}
      <AnimatePresence>
        {showCreateUser && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowCreateUser(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">Créer un Compte</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">Ajouter un nouvel utilisateur</p>
                </div>
                <button onClick={() => setShowCreateUser(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Role selector */}
              <div className="mb-5">
                <label className="text-xs text-gray-400 dark:text-gray-300 tracking-widest uppercase mb-2 block">
                  Rôle
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'ETUDIANT', label: 'Étudiant', icon: '🎓' },
                    { id: 'ENCADRANT', label: 'Encadrant', icon: '👨‍💼' },
                    { id: 'ADMIN', label: 'Admin', icon: '🔧' },
                  ].map(r => (
                    <motion.button
                      key={r.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setUserForm({ ...userForm, role: r.id })}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                        userForm.role === r.id
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {r.icon} {r.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Fields */}
              {[
                { key: 'nom', label: 'Nom complet', placeholder: 'Mohamed Aziz Jouini', type: 'text' },
                { key: 'email', label: 'Email', placeholder: 'user@example.com', type: 'email' },
                { key: 'password', label: 'Mot de passe', placeholder: '••••••••', type: 'password' },
              ].map(field => (
                <div key={field.key} className="mb-4">
                  <label className="text-xs text-gray-400 dark:text-gray-300 tracking-widest uppercase mb-2 block">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={userForm[field.key as keyof typeof userForm]}
                    onChange={e => setUserForm({ ...userForm, [field.key]: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-3 rounded-xl border-b-2 border-transparent focus:border-primary outline-none text-sm transition-all"
                  />
                </div>
              ))}

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={createUser}
                disabled={loadingCreate}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #0d1e25, #23333a)' }}
              >
                {loadingCreate ? (
                  <motion.div animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                ) : (
                  <><Plus className="w-4 h-4" />CRÉER LE COMPTE</>
                )}
              </motion.button>
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
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">Ajouter une date limite</p>
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
                  className="w-full bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-3 rounded-xl border-b-2 border-transparent focus:border-amber-500 outline-none text-sm transition-all"
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
                  className="w-full bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-3 rounded-xl border-b-2 border-transparent focus:border-amber-500 outline-none text-sm transition-all"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={createDeadline}
                disabled={loadingCreate}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
              >
                {loadingCreate ? (
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