import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, FileText, Bell, User,
  Settings, HelpCircle, Moon, Sun, LogOut,
  Plus, TrendingUp, Target, Clock, Award
} from 'lucide-react'
import { X, Send, UserCheck } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie,
  Cell, Legend
} from 'recharts'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../hooks/useTheme'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import api from '../services/api'




const COLORS = ['#142588', '#006c48', '#ef4444', '#f59e0b']

export default function StudentDashboard() {
  const { nom, logout } = useAuthStore()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [rapports, setRapports] = useState<any[]>([])
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [showDemandeModal, setShowDemandeModal] = useState(false)
  const [encadrants, setEncadrants] = useState<any[]>([])
  const [selectedEncadrant, setSelectedEncadrant] = useState<any>(null)
  const [messageDemande, setMessageDemande] = useState('')
  const [demandes, setDemandes] = useState<any[]>([])
  const [loadingDemande, setLoadingDemande] = useState(false)
  

  useEffect(() => {
  fetchRapports()
  fetchEncadrants()
  fetchDemandes()
}, [])

  const fetchRapports = async () => {
    try {
      const res = await api.get('/rapports')
      setRapports(res.data)
    } catch {
      toast.error('Erreur de chargement')
    }
  }
  const fetchEncadrants = async () => {
  try {
    const res = await api.get('/users')
    setEncadrants(res.data.filter((u: any) => u.role === 'ENCADRANT'))
  } catch {
    toast.error('Erreur chargement encadrants')
  }
}

const fetchDemandes = async () => {
  try {
    const userId = localStorage.getItem('userId')
    if (!userId) return
    const res = await api.get(`/demandes/etudiant/${userId}`)
    setDemandes(res.data)
  } catch {
    console.error('Erreur demandes')
  }
}

const soumettreDemande = async () => {
  if (!selectedEncadrant) {
    toast.error('Sélectionnez un encadrant')
    return
  }
  if (!messageDemande.trim()) {
    toast.error('Écrivez un message')
    return
  }
  setLoadingDemande(true)
  try {
    const userId = localStorage.getItem('userId')
    await api.post('/demandes', {
      etudiantId: userId,
      encadrantId: selectedEncadrant.id,
      message: messageDemande
    })
    toast.success('Demande envoyée à ' + selectedEncadrant.nom + ' !')
    setShowDemandeModal(false)
    setMessageDemande('')
    setSelectedEncadrant(null)
    fetchDemandes()
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Erreur envoi demande')
  } finally {
    setLoadingDemande(false)
  }
}

  const total = rapports.length
  const soumis = rapports.filter(r => r.statut === 'SOUMIS').length
  const valide = rapports.filter(r => r.statut === 'VALIDE').length
  const rejete = rapports.filter(r => r.statut === 'REJETE').length
  const completionScore = total > 0 ? Math.round((valide / total) * 100) : 0
  const onTimeRate = total > 0 ? Math.round(((total - rejete) / total) * 100) : 0

  const pieData = [
    { name: 'Soumis', value: soumis },
    { name: 'Validé', value: valide },
    { name: 'Rejeté', value: rejete },
  ].filter(d => d.value > 0)

  const lineData = rapports.slice(-6).map((r, i) => ({
    name: `S${i + 1}`,
    score: r.statut === 'VALIDE' ? 100 : r.statut === 'SOUMIS' ? 60 : 20,
  }))

  const axisColor = isDark ? '#e5e7eb' : '#9ca3af'
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,37,136,0.06)'
  const tooltipBg = isDark ? '#1f2937' : '#ffffff'
  const legendColor = isDark ? '#e5e7eb' : '#9ca3af'

  const statCards = [
    {
      icon: Target,
      label: 'Completion Score',
      value: `${completionScore}%`,
      sub: 'Rapports validés',
      color: 'text-primary',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-primary',
      border: 'border-l-primary'
    },
    {
      icon: TrendingUp,
      label: 'Progress Rate',
      value: `${total > 0 ? Math.round((total / 10) * 100) : 0}%`,
      sub: `${total} / 10 rapports`,
      color: 'text-secondary',
      bg: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-secondary',
      border: 'border-l-secondary'
    },
    {
      icon: Clock,
      label: 'On Time Rate',
      value: `${onTimeRate}%`,
      sub: 'Soumis dans les délais',
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600',
      border: 'border-l-purple-500'
    },
    {
      icon: Award,
      label: 'Total Submissions',
      value: String(total).padStart(2, '0'),
      sub: 'Rapports soumis',
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      iconColor: 'text-amber-600',
      border: 'border-l-amber-500'
    },
  ]

  // ── Nav items avec path ──────────────────────────────────────────────────
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard',     path: null },
    { icon: FileText,        label: 'Reports',       path: null },
    { icon: Bell,            label: 'Notifications', path: null },
    { icon: User,            label: 'Profile',       path: '/profile' },
  ]

  // ── Gestion du clic nav ──────────────────────────────────────────────────
  const handleNavClick = (label: string, path: string | null) => {
    setActiveNav(label)
    if (path) navigate(path)
  }

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
        style={{ borderRight: '1px solid rgba(20,37,136,0.06)' }}
      >
        <div className="mb-10 px-2">
          <h1 className="text-primary font-bold text-lg tracking-wide">Dossier Pro</h1>
          <p className="text-gray-400 dark:text-gray-400 text-xs tracking-widest uppercase mt-0.5">
            Internship Portal
          </p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ icon: Icon, label, path }) => (
            <motion.button
              key={label}
              whileHover={{ x: 3 }}
              onClick={() => handleNavClick(label, path)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeNav === label
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-500 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-white'
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
          <div className="flex items-center gap-3 bg-blue-50 dark:bg-gray-800 rounded-xl px-4 py-2.5 w-72">
            <span className="text-gray-400 text-sm">🔍</span>
            <input placeholder="Search dossier..."
              className="bg-transparent text-sm text-gray-600 dark:text-gray-100 outline-none w-full placeholder-gray-400 dark:placeholder-gray-500" />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowDemandeModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium shadow-lg shadow-primary/20"
                style={{ background: 'linear-gradient(135deg, #142588, #303f9f)' }}
              >
                <UserCheck className="w-4 h-4" />DEMANDER ENCADRANT
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
                style={{ background: 'linear-gradient(135deg, #006c48, #059669)' }}
              >
                <Plus className="w-4 h-4" />NEW SUBMISSION
              </motion.button>
            </div>

            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>

            {/* Avatar cliquable → Profile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white text-sm font-bold"
              title="Mon profil"
            >
              {nom?.charAt(0).toUpperCase() || 'U'}
            </motion.button>
          </div>
        </motion.header>

        {/* CONTENT */}
        <div className="flex-1 p-8 overflow-auto">

          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white" style={{ letterSpacing: '-0.02em' }}>
              Hello, {nom?.split(' ')[0] || 'Student'}.
            </h2>
            <p className="text-gray-400 dark:text-gray-300 mt-1 text-sm">
              Track your internship progress and manage your submissions.
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
          <div className="grid grid-cols-3 gap-4 mb-8">

            {/* Line Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Performance Timeline</h3>
              <p className="text-xs text-gray-400 dark:text-gray-300 mb-6">Your report scores over time</p>
              {lineData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: tooltipBg,
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        fontSize: '12px',
                        color: isDark ? '#fff' : '#111'
                      }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#142588" strokeWidth={2.5}
                      dot={{ fill: '#142588', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center text-gray-300 dark:text-gray-600">
                    <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm dark:text-gray-400">No data yet</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Pie Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Status Breakdown</h3>
              <p className="text-xs text-gray-400 dark:text-gray-300 mb-4">Distribution of reports</p>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                      paddingAngle={3} dataKey="value">
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: tooltipBg,
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: isDark ? '#fff' : '#111'
                      }}
                    />
                    <Legend iconType="circle" iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: '11px', color: legendColor }}>{value}</span>
                      )} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 flex items-center justify-center">
                  <div className="text-center text-gray-300 dark:text-gray-600">
                    <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm dark:text-gray-400">No data yet</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* DEMANDES STATUS */}
          {demandes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm mb-8"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                Mes Demandes d'Encadrement
              </h3>
              <div className="flex flex-col gap-3">
                {demandes.map((demande, i) => (
                  <motion.div
                    key={demande.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-blue-50/50 dark:bg-gray-800"
                    style={{ borderLeft: '3px solid #142588' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <UserCheck className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {demande.encadrant?.nom}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">
                          {new Date(demande.dateDemande).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${
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
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* RECENT REPORTS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Recent Submissions</h3>
                <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">Your latest internship reports</p>
              </div>
              <button className="text-sm text-primary font-medium hover:opacity-70 transition-opacity">
                View All →
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {rapports.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-20 text-gray-400 dark:text-gray-500" />
                  <p className="text-sm font-medium text-gray-400 dark:text-gray-300">No reports submitted yet</p>
                  <p className="text-xs mt-1 text-gray-400 dark:text-gray-500">Click NEW SUBMISSION to get started</p>
                </div>
              ) : (
                rapports.slice(0, 5).map((rapport, i) => (
                  <motion.div
                    key={rapport.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-blue-50/50 dark:bg-gray-800 cursor-pointer transition-all"
                    style={{ borderLeft: '3px solid #142588' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{rapport.titre}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">
                          {rapport.dateDepot
                            ? new Date(rapport.dateDepot).toLocaleDateString('fr-FR', {
                                day: 'numeric', month: 'short', year: 'numeric'
                              })
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatutColor(rapport.statut)}`}>
                      {rapport.statut}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* MODAL DEMANDE ENCADRANT */}
      <AnimatePresence>
        {showDemandeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowDemandeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    Demander un Encadrant
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-300 mt-0.5">
                    Choisissez votre encadrant de stage
                  </p>
                </div>
                <button
                  onClick={() => setShowDemandeModal(false)}
                  className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Encadrants list */}
              <div className="mb-4">
                <label className="text-xs text-gray-400 dark:text-gray-300 tracking-widest uppercase mb-2 block">
                  Choisir un encadrant
                </label>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                  {encadrants.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      Aucun encadrant disponible
                    </p>
                  ) : (
                    encadrants.map(enc => (
                      <motion.button
                        key={enc.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedEncadrant(enc)}
                        className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                          selectedEncadrant?.id === enc.id
                            ? 'bg-primary text-white'
                            : 'bg-blue-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          selectedEncadrant?.id === enc.id
                            ? 'bg-white/20 text-white'
                            : 'bg-primary/10 text-primary'
                        }`}>
                          {enc.nom?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{enc.nom}</p>
                          <p className={`text-xs ${selectedEncadrant?.id === enc.id ? 'text-white/70' : 'text-gray-400'}`}>
                            {enc.email}
                          </p>
                        </div>
                        {selectedEncadrant?.id === enc.id && (
                          <UserCheck className="w-4 h-4 ml-auto" />
                        )}
                      </motion.button>
                    ))
                  )}
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="text-xs text-gray-400 dark:text-gray-300 tracking-widest uppercase mb-2 block">
                  Message
                </label>
                <textarea
                  value={messageDemande}
                  onChange={e => setMessageDemande(e.target.value)}
                  placeholder="Bonjour, je souhaite être encadré par vous..."
                  rows={3}
                  className="w-full bg-blue-50 dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-3 rounded-xl border-b-2 border-transparent focus:border-primary outline-none text-sm transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={soumettreDemande}
                disabled={loadingDemande}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg, #142588, #303f9f)' }}
              >
                {loadingDemande ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    ENVOYER LA DEMANDE
                  </>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}