import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Users, FileText, TrendingUp, TrendingDown, 
  Calendar, Award, Target, Zap, BarChart3, Download,
  Filter, CheckCircle2, XCircle, Send, UserCheck, 
  GraduationCap, Shield, Star, Trophy, Moon, Sun
} from 'lucide-react'
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useAuthStore } from '../store/authStore'
import { useTheme } from '../hooks/useTheme'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import api from '../services/api'

const COLORS = ['#142588', '#421384', '#006c48', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminAnalyticsPage() {
  const { nom } = useAuthStore()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [users, setUsers] = useState<any[]>([])
  const [rapports, setRapports] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, rapportsRes] = await Promise.all([
        api.get('/users'),
        api.get('/rapports'),
      ])
      setUsers(usersRes.data)
      setRapports(rapportsRes.data)
    } catch (error) {
      console.error('Erreur chargement analytics:', error)
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  // Stats
  const etudiants = users.filter(u => u.role === 'ETUDIANT')
  const encadrants = users.filter(u => u.role === 'ENCADRANT')
  const totalRapports = rapports.length
  const valides = rapports.filter(r => r.statut === 'VALIDE').length
  const soumis = rapports.filter(r => r.statut === 'SOUMIS').length
  const rejetes = rapports.filter(r => r.statut === 'REJETE').length
  
  const tauxValidation = totalRapports > 0 ? Math.round((valides / totalRapports) * 100) : 0
  const tauxSoumission = etudiants.length > 0 ? Math.round((totalRapports / etudiants.length) * 100) : 0
  const rapportsParEtudiant = etudiants.length > 0 ? (totalRapports / etudiants.length).toFixed(1) : '0'

  const etudiantsActifs = etudiants.filter(e => rapports.some(r => r.auteur?.id === e.id)).length
  const tauxEngagement = etudiants.length > 0 ? Math.round((etudiantsActifs / etudiants.length) * 100) : 0

  const axisColor = isDark ? '#e5e7eb' : '#9ca3af'
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(20,37,136,0.06)'
  const tooltipBg = isDark ? '#1f2937' : '#ffffff'

  // Données mensuelles
  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const monthName = monthDate.toLocaleDateString('fr-FR', { month: 'short' })
    const ratio = (i + 1) / 6
    return {
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      rapports: Math.floor(totalRapports * ratio),
      valides: Math.floor(valides * ratio),
    }
  })

  // Activité hebdomadaire
  const weeklyActivityData = [
    { day: 'Lun', activite: Math.floor(totalRapports * 0.18) },
    { day: 'Mar', activite: Math.floor(totalRapports * 0.22) },
    { day: 'Mer', activite: Math.floor(totalRapports * 0.20) },
    { day: 'Jeu', activite: Math.floor(totalRapports * 0.19) },
    { day: 'Ven', activite: Math.floor(totalRapports * 0.15) },
    { day: 'Sam', activite: Math.floor(totalRapports * 0.04) },
    { day: 'Dim', activite: Math.floor(totalRapports * 0.02) },
  ]

  // Performance Radar
  const performanceData = [
    { subject: 'Soumission', A: tauxSoumission, fullMark: 100 },
    { subject: 'Validation', A: tauxValidation, fullMark: 100 },
    { subject: 'Engagement', A: tauxEngagement, fullMark: 100 },
    { subject: 'Qualité', A: valides > 0 ? Math.round((valides / (valides + rejetes)) * 100) : 0, fullMark: 100 },
    { subject: 'Activité', A: totalRapports > 0 ? Math.min(100, totalRapports * 2) : 0, fullMark: 100 },
  ]

  // Pie charts
  const statusDistribution = [
    { name: 'Validé', value: valides, color: '#006c48' },
    { name: 'Soumis', value: soumis, color: '#142588' },
    { name: 'Rejeté', value: rejetes, color: '#ef4444' },
  ].filter(s => s.value > 0)

  const roleDistribution = [
    { name: 'Étudiants', value: etudiants.length, color: '#142588' },
    { name: 'Encadrants', value: encadrants.length, color: '#421384' },
    { name: 'Admins', value: users.filter(u => u.role === 'ADMIN').length, color: '#006c48' },
  ].filter(r => r.value > 0)

  // Top performers
  const topEtudiants = etudiants
    .map(e => ({
      ...e,
      rapportsCount: rapports.filter(r => r.auteur?.id === e.id).length,
      validesCount: rapports.filter(r => r.auteur?.id === e.id && r.statut === 'VALIDE').length,
    }))
    .filter(e => e.rapportsCount > 0)
    .sort((a, b) => b.validesCount - a.validesCount)
    .slice(0, 5)

  const topEncadrants = encadrants
    .map(enc => ({
      ...enc,
      rapportsCount: rapports.filter(r => r.encadrant?.id === enc.id).length,
      validesCount: rapports.filter(r => r.encadrant?.id === enc.id && r.statut === 'VALIDE').length,
    }))
    .filter(enc => enc.rapportsCount > 0)
    .sort((a, b) => b.rapportsCount - a.rapportsCount)
    .slice(0, 5)

  // KPI Cards
  const kpiCards = [
    {
      icon: Target,
      label: 'Taux de Validation',
      value: `${tauxValidation}%`,
      trend: tauxValidation > 70 ? '+5%' : '-2%',
      isPositive: tauxValidation > 70,
      color: 'text-secondary',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      icon: Zap,
      label: 'Taux de Soumission',
      value: `${tauxSoumission}%`,
      trend: tauxSoumission > 80 ? '+8%' : '-3%',
      isPositive: tauxSoumission > 80,
      color: 'text-primary',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      icon: Award,
      label: 'Engagement Moyen',
      value: `${tauxEngagement}%`,
      trend: tauxEngagement > 75 ? '+4%' : '-6%',
      isPositive: tauxEngagement > 75,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      icon: BarChart3,
      label: 'Rapports / Étudiant',
      value: rapportsParEtudiant,
      trend: parseFloat(rapportsParEtudiant) > 2 ? '+15%' : '+7%',
      isPositive: parseFloat(rapportsParEtudiant) > 2,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'} font-sans`}>
      <Toaster position="top-right" richColors />

      {/* TOPBAR */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b backdrop-blur-md ${
          isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ x: -3 }}
            onClick={() => navigate('/admin')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-400' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <h2 className="text-xl font-bold">Advanced Analytics</h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">Performance insights & trends</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />Filtres
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #0d1e25, #23333a)' }}
          >
            <Download className="w-4 h-4" />Export PDF
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </motion.button>
          <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white text-sm font-bold">
            {nom?.charAt(0).toUpperCase() || 'A'}
          </div>
        </div>
      </motion.header>

      {/* CONTENT */}
      <div className="p-8">

        {/* TIME RANGE SELECTOR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6"
        >
          {[
            { key: 'week', label: 'Cette semaine' },
            { key: 'month', label: 'Ce mois' },
            { key: 'year', label: 'Cette année' }
          ].map(range => (
            <motion.button
              key={range.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTimeRange(range.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 ${
                timeRange === range.key
                  ? 'bg-primary text-white shadow-lg'
                  : isDark 
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <Calendar className="w-3 h-3" />
              {range.label}
            </motion.button>
          ))}
        </motion.div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {kpiCards.map(({ icon: Icon, label, value, trend, isPositive, color, bg }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -2 }}
              className={`rounded-2xl p-5 shadow-sm border-l-4 border-l-primary ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{label}</p>
              <div className="flex items-end gap-2">
                <p className={`text-3xl font-bold ${color}`} style={{ letterSpacing: '-0.02em' }}>{value}</p>
                <div className={`flex items-center gap-1 text-xs font-medium mb-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {trend}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CHARTS ROW 1 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`col-span-2 rounded-2xl p-6 shadow-sm ${isDark ? 'bg-gray-900' : 'bg-white'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Monthly Report Trends</h3>
            </div>
            <p className="text-xs text-gray-400 mb-6">Évolution des rapports par mois</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRapports" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#142588" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#142588" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: axisColor }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="rapports" stroke="#142588" strokeWidth={3} fill="url(#colorRapports)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`rounded-2xl p-6 shadow-sm ${isDark ? 'bg-gray-900' : 'bg-white'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">Performance Score</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">Metrics clés</p>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={performanceData}>
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: axisColor }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: axisColor }} />
                <Radar name="Score" dataKey="A" stroke="#142588" fill="#142588" fillOpacity={0.6} />
                <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: '12px', fontSize: '11px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* CHARTS ROW 2 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={`rounded-2xl p-6 shadow-sm ${isDark ? 'bg-gray-900' : 'bg-white'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-5 h-5 text-amber-600" />
              <h3 className="font-semibold">Weekly Activity</h3>
            </div>
            <p className="text-xs text-gray-400 mb-6">Distribution par jour</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                <Bar dataKey="activite" fill="#142588" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`rounded-2xl p-6 shadow-sm ${isDark ? 'bg-gray-900' : 'bg-white'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-secondary" />
              <h3 className="font-semibold">Report Status</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">Distribution des statuts</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                  {statusDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: '11px', color: axisColor }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className={`rounded-2xl p-6 shadow-sm ${isDark ? 'bg-gray-900' : 'bg-white'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">User Roles</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">Répartition des rôles</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={roleDistribution} cx="50%" cy="50%" outerRadius={75} dataKey="value">
                  {roleDistribution.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: tooltipBg, border: 'none', borderRadius: '12px', fontSize: '11px' }} />
                <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ fontSize: '11px', color: axisColor }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* TOP PERFORMERS */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className={`rounded-2xl p-6 shadow-sm ${isDark ? 'bg-gray-900' : 'bg-white'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold">Top Étudiants</h3>
            </div>
            <p className="text-xs text-gray-400 mb-5">Plus de rapports validés</p>
            
            {topEtudiants.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Aucune donnée disponible</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topEtudiants.map((etu, i) => (
                  <motion.div
                    key={etu.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        #{i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{etu.nom}</p>
                        <p className="text-xs text-gray-400">{etu.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-secondary" />
                        <p className="text-sm font-bold text-secondary">{etu.validesCount}</p>
                      </div>
                      <p className="text-xs text-gray-400">{etu.rapportsCount} total</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className={`rounded-2xl p-6 shadow-sm ${isDark ? 'bg-gray-900' : 'bg-white'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">Top Encadrants</h3>
            </div>
            <p className="text-xs text-gray-400 mb-5">Plus actifs</p>
            
            {topEncadrants.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Aucune donnée disponible</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topEncadrants.map((enc, i) => (
                  <motion.div
                    key={enc.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm font-bold text-purple-600">
                        #{i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{enc.nom}</p>
                        <p className="text-xs text-gray-400">{enc.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <p className="text-sm font-bold text-purple-600">{enc.rapportsCount}</p>
                      </div>
                      <p className="text-xs text-gray-400">{enc.validesCount} validés</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}