import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Users, Plus, Search, X, Check,
  Trash2, Edit3, Eye, Loader2, Save,
  GraduationCap, UserCheck, Shield, Mail,
  Phone, MapPin, Building2, ChevronDown,
  AlertCircle, Filter, CheckCircle2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import api from '../services/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface User {
  id: number
  nom: string
  email: string
  role: 'ETUDIANT' | 'ENCADRANT' | 'ADMIN'
  telephone?: string
  ville?: string
  entreprise?: string
  photoUrl?: string
}

// ─── Role config ───────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  ETUDIANT: {
    label: 'Étudiant',
    icon: GraduationCap,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  },
  ENCADRANT: {
    label: 'Encadrant',
    icon: UserCheck,
    color: 'text-purple-600',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  },
  ADMIN: {
    label: 'Admin',
    icon: Shield,
    color: 'text-gray-600',
    bg: 'bg-gray-100 dark:bg-gray-800',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const navigate = useNavigate()
  const isDark = localStorage.getItem('theme') === 'dark'

  // ── Data ───────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ETUDIANT' | 'ENCADRANT' | 'ADMIN'>('ALL')

  // ── Selected user (detail panel) ──────────────────────────────────────────
  const [selected, setSelected] = useState<User | null>(null)

  // ── Create modal ───────────────────────────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ nom: '', email: '', password: '', role: 'ETUDIANT' })

  // ── Edit modal ─────────────────────────────────────────────────────────────
  const [showEdit, setShowEdit] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ nom: '', email: '', telephone: '', ville: '', entreprise: '' })

  // ── Delete confirm ─────────────────────────────────────────────────────────
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await api.get<User[]>('/users')
      setUsers(res.data)
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // ── Create user ────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.nom || !createForm.email || !createForm.password) {
      toast.error('Remplissez tous les champs')
      return
    }
    setCreating(true)
    try {
      await api.post('/auth/register', createForm)
      toast.success(`Compte ${createForm.role} créé pour ${createForm.nom} !`)
      setShowCreate(false)
      setCreateForm({ nom: '', email: '', password: '', role: 'ETUDIANT' })
      fetchUsers()
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? 'Erreur création compte')
    } finally {
      setCreating(false)
    }
  }

  // ── Open edit ──────────────────────────────────────────────────────────────
  const openEdit = (user: User) => {
    setSelected(user)
    setEditForm({
      nom: user.nom,
      email: user.email,
      telephone: user.telephone ?? '',
      ville: user.ville ?? '',
      entreprise: user.entreprise ?? '',
    })
    setShowEdit(true)
  }

  // ── Save edit ──────────────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!selected) return
    setEditing(true)
    try {
      await api.put<User>(`/users/${selected.id}`, editForm)
      setUsers(prev => prev.map(u => (u.id === selected.id ? { ...u, ...editForm } : u)))
      if (selected.id === Number(localStorage.getItem('userId'))) {
        localStorage.setItem('nom', editForm.nom)
      }
      toast.success('Utilisateur mis à jour !')
      setShowEdit(false)
      setSelected(prev => (prev ? { ...prev, ...editForm } : prev))
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setEditing(false)
    }
  }

  // ── Delete user ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api.delete(`/users/${deleteId}`)
      setUsers(prev => prev.filter(u => u.id !== deleteId))
      if (selected?.id === deleteId) setSelected(null)
      toast.success('Utilisateur supprimé')
      setDeleteId(null)
    } catch {
      toast.error('Erreur suppression')
    } finally {
      setDeleting(false)
    }
  }

  // ── Navigate back ──────────────────────────────────────────────────────────
  const goBack = () => navigate('/admin')

  // ── Filtered ───────────────────────────────────────────────────────────────
  const filtered = users
    .filter(u => roleFilter === 'ALL' || u.role === roleFilter)
    .filter(
      u =>
        u.nom.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const order = { ADMIN: 0, ENCADRANT: 1, ETUDIANT: 2 }
      return order[a.role] - order[b.role]
    })

  // Stats
  const total = users.length
  const etudiants = users.filter(u => u.role === 'ETUDIANT').length
  const encadrants = users.filter(u => u.role === 'ENCADRANT').length
  const admins = users.filter(u => u.role === 'ADMIN').length

  // ── Styles ─────────────────────────────────────────────────────────────────
  const bg = isDark ? 'bg-gray-950' : 'bg-[#f8f9ff]'
  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'
  const input = isDark
    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-blue-500'
    : 'bg-gray-50 border-slate-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
  const muted = isDark ? 'text-gray-400' : 'text-slate-500'

  return (
    <div className={`min-h-screen ${bg} ${isDark ? 'text-gray-100' : 'text-gray-900'} font-sans`}>
      <Toaster position="top-right" richColors />

      {/* ── Topbar ────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b backdrop-blur-md ${
          isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Users size={18} className="text-blue-600" /> Gestion des Utilisateurs
            </h1>
            <p className={`text-xs ${muted}`}>
              {total} utilisateur{total > 1 ? 's' : ''} enregistré{total > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0d1e25, #23333a)' }}
        >
          <Plus size={16} /> Créer un compte
        </motion.button>
      </motion.header>

      <div className="flex h-[calc(100vh-65px)]">
        {/* ══ Colonne gauche — Liste ═══════════════════════════════════════════ */}
        <div
          className={`w-full lg:w-96 flex flex-col border-r ${
            isDark ? 'border-gray-800' : 'border-slate-200'
          } ${selected && !showEdit ? 'hidden lg:flex' : 'flex'}`}
        >
          {/* Stats */}
          <div
            className={`px-4 py-3 border-b ${
              isDark ? 'border-gray-800 bg-gray-900' : 'border-slate-100 bg-white'
            }`}
          >
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Total', val: total, color: isDark ? 'text-gray-100' : 'text-gray-800' },
                { label: 'Étudiants', val: etudiants, color: 'text-blue-600' },
                { label: 'Encadrants', val: encadrants, color: 'text-purple-600' },
                { label: 'Admins', val: admins, color: 'text-gray-600' },
              ].map(({ label, val, color }) => (
                <div
                  key={label}
                  className={`text-center p-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-slate-50'}`}
                >
                  <p className={`text-base font-bold ${color}`}>{val}</p>
                  <p className={`text-xs ${muted}`}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Search + filtres */}
          <div
            className={`p-3 space-y-2 border-b ${
              isDark ? 'border-gray-800 bg-gray-900' : 'border-slate-100 bg-white'
            }`}
          >
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-transparent'
              }`}
            >
              <Search size={14} className={muted} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un utilisateur..."
                className="flex-1 text-sm bg-transparent outline-none"
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X size={13} className={muted} />
                </button>
              )}
            </div>

            {/* Role tabs */}
            <div className="flex gap-1">
              {(['ALL', 'ETUDIANT', 'ENCADRANT', 'ADMIN'] as const).map(r => {
                const RoleIcon =
                  r === 'ALL'
                    ? Users
                    : r === 'ETUDIANT'
                    ? GraduationCap
                    : r === 'ENCADRANT'
                    ? UserCheck
                    : Shield
                return (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                      roleFilter === r
                        ? r === 'ALL'
                          ? 'bg-gray-900 dark:bg-gray-700 text-white'
                          : r === 'ETUDIANT'
                          ? 'bg-blue-500 text-white'
                          : r === 'ENCADRANT'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-600 text-white'
                        : `${muted} ${isDark ? 'hover:bg-gray-800' : 'hover:bg-slate-100'}`
                    }`}
                  >
                    <RoleIcon size={12} />
                    {r === 'ALL' ? 'Tous' : r === 'ETUDIANT' ? 'Étu' : r === 'ENCADRANT' ? 'Enc' : 'Adm'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Liste users */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-blue-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className={`text-center py-16 ${muted}`}>
                <Users size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Aucun utilisateur trouvé</p>
              </div>
            ) : (
              filtered.map((user, i) => {
                const cfg = ROLE_CONFIG[user.role]
                const Icon = cfg.icon
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`flex items-center gap-3 px-4 py-3.5 border-b cursor-pointer transition-all ${
                      selected?.id === user.id
                        ? isDark
                          ? 'bg-blue-900/20 border-blue-800'
                          : 'bg-blue-50 border-blue-200'
                        : isDark
                        ? 'border-gray-800 hover:bg-gray-800/50'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                    onClick={() => setSelected(user)}
                  >
                    {/* Avatar */}
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={user.nom}
                        className="w-10 h-10 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${cfg.bg} ${cfg.color}`}
                      >
                        {user.nom.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{user.nom}</p>
                      <p className={`text-xs truncate ${muted}`}>{user.email}</p>
                    </div>

                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${cfg.badge}`}>
                      <Icon size={12} />
                      {cfg.label}
                    </span>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>

        {/* ══ Colonne droite — Détail user ════════════════════════════════════ */}
        <div className={`flex-1 flex flex-col ${!selected ? 'hidden lg:flex' : 'flex'}`}>
          {!selected ? (
            <div className={`flex-1 flex items-center justify-center ${muted}`}>
              <div className="text-center">
                <Users size={48} className="mx-auto mb-3 opacity-20" />
                <p className="font-medium">Sélectionnez un utilisateur</p>
                <p className="text-xs mt-1 opacity-60">pour voir ses détails et le gérer</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div
                  className={`px-6 py-5 border-b flex items-center justify-between ${
                    isDark ? 'border-gray-800 bg-gray-900' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelected(null)}
                      className={`lg:hidden p-1.5 rounded-lg ${
                        isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                      }`}
                    >
                      <ArrowLeft size={16} />
                    </button>

                    {selected.photoUrl ? (
                      <img
                        src={selected.photoUrl}
                        alt={selected.nom}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                          ROLE_CONFIG[selected.role].bg
                        } ${ROLE_CONFIG[selected.role].color}`}
                      >
                        {selected.nom.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <h2 className="font-bold text-base">{selected.nom}</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            ROLE_CONFIG[selected.role].badge
                          }`}
                        >
                          {(() => {
                            const Icon = ROLE_CONFIG[selected.role].icon
                            return <Icon size={12} />
                          })()}
                          {ROLE_CONFIG[selected.role].label}
                        </span>
                        <span className={`text-xs ${muted}`}>ID #{selected.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(selected)}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors ${
                        isDark
                          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Edit3 size={13} /> Modifier
                    </button>
                    <button
                      onClick={() => setDeleteId(selected.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 size={13} /> Supprimer
                    </button>
                  </div>
                </div>

                {/* Corps */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {/* Infos principales */}
                  <div className={`rounded-2xl border ${card} p-5`}>
                    <h3 className={`text-xs font-semibold uppercase tracking-wider ${muted} mb-4`}>
                      Informations du compte
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { icon: Mail, label: 'Email', val: selected.email },
                        { icon: Phone, label: 'Téléphone', val: selected.telephone ?? 'Non renseigné' },
                        { icon: MapPin, label: 'Ville', val: selected.ville ?? 'Non renseigné' },
                        { icon: Building2, label: 'Entreprise', val: selected.entreprise ?? 'Non renseigné' },
                      ].map(({ icon: Icon, label, val }) => (
                        <div key={label} className={`rounded-xl p-3 ${isDark ? 'bg-gray-800' : 'bg-slate-50'}`}>
                          <p className={`text-xs ${muted} mb-1`}>{label}</p>
                          <p className="text-sm font-medium flex items-center gap-1.5 truncate">
                            <Icon size={12} className={muted} /> {val}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rôle et permissions */}
                  <div className={`rounded-2xl border ${card} p-5`}>
                    <h3 className={`text-xs font-semibold uppercase tracking-wider ${muted} mb-4`}>
                      Rôle & Permissions
                    </h3>
                    <div className={`flex items-center gap-4 p-4 rounded-xl ${ROLE_CONFIG[selected.role].bg}`}>
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                        {(() => {
                          const Icon = ROLE_CONFIG[selected.role].icon
                          return <Icon size={24} className={ROLE_CONFIG[selected.role].color} />
                        })()}
                      </div>
                      <div>
                        <p className={`font-bold ${ROLE_CONFIG[selected.role].color}`}>
                          {ROLE_CONFIG[selected.role].label}
                        </p>
                        <p className={`text-xs mt-0.5 ${muted}`}>
                          {selected.role === 'ETUDIANT' && 'Peut soumettre des rapports et demander un encadrant'}
                          {selected.role === 'ENCADRANT' && 'Peut valider des rapports et gérer ses étudiants'}
                          {selected.role === 'ADMIN' && 'Accès complet à toutes les fonctionnalités'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions rapides */}
                  <div className={`rounded-2xl border ${card} p-5`}>
                    <h3 className={`text-xs font-semibold uppercase tracking-wider ${muted} mb-4`}>
                      Actions rapides
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <a
                        href={`mailto:${selected.email}`}
                        className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-colors ${
                          isDark
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Mail size={14} className="text-blue-500" /> Envoyer email
                      </a>
                      <button
                        onClick={() => openEdit(selected)}
                        className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium transition-colors ${
                          isDark
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Edit3 size={14} className="text-purple-500" /> Modifier le profil
                      </button>
                      <button
                        onClick={() => setDeleteId(selected.id)}
                        className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors col-span-2"
                      >
                        <Trash2 size={14} /> Supprimer ce compte
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* ══ Modal Créer Utilisateur ════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 28 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="px-6 pt-6 pb-4"
                style={{
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-900">
                      <Plus size={16} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base">Créer un compte</h2>
                      <p className={`text-xs ${muted}`}>Ajouter un nouvel utilisateur</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreate(false)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Rôle */}
                <div>
                  <label className={`text-xs font-semibold tracking-wider uppercase mb-2 block ${muted}`}>
                    Rôle *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['ETUDIANT', 'ENCADRANT', 'ADMIN'] as const).map(r => {
                      const Icon = ROLE_CONFIG[r].icon
                      return (
                        <button
                          key={r}
                          onClick={() => setCreateForm(p => ({ ...p, role: r }))}
                          className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                            createForm.role === r
                              ? r === 'ETUDIANT'
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : r === 'ENCADRANT'
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                                : 'border-gray-500 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                              : isDark
                              ? 'border-gray-700 text-gray-400 hover:border-gray-600'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <Icon size={18} />
                          {ROLE_CONFIG[r].label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Champs */}
                {[
                  { key: 'nom', label: 'Nom complet *', placeholder: 'Mohamed Aziz Jouini', type: 'text' },
                  { key: 'email', label: 'Email *', placeholder: 'user@example.com', type: 'email' },
                  { key: 'password', label: 'Mot de passe *', placeholder: '••••••••', type: 'password' },
                ].map(({ key, label, placeholder, type }) => (
                  <div key={key}>
                    <label className={`text-xs font-semibold tracking-wider uppercase mb-1.5 block ${muted}`}>
                      {label}
                    </label>
                    <input
                      type={type}
                      value={createForm[key as keyof typeof createForm]}
                      onChange={e => setCreateForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className={`w-full h-10 px-4 border rounded-xl text-sm outline-none transition-all ${input}`}
                    />
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowCreate(false)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${
                      isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Annuler
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #0d1e25, #23333a)' }}
                  >
                    {creating ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Plus size={14} /> Créer
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Modal Modifier Utilisateur ═════════════════════════════════════════ */}
      <AnimatePresence>
        {showEdit && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
            onClick={() => setShowEdit(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 28 }}
              className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <div
                className="px-6 pt-6 pb-4"
                style={{
                  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        ROLE_CONFIG[selected.role].bg
                      }`}
                    >
                      <Edit3 size={16} className={ROLE_CONFIG[selected.role].color} />
                    </div>
                    <div>
                      <h2 className="font-bold text-base">Modifier {selected.nom}</h2>
                      <p className={`text-xs ${muted} flex items-center gap-1`}>
                        {(() => {
                          const Icon = ROLE_CONFIG[selected.role].icon
                          return <Icon size={12} />
                        })()}
                        {ROLE_CONFIG[selected.role].label}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEdit(false)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {[
                  { key: 'nom', label: 'Nom complet', placeholder: 'Nom...', icon: Users },
                  { key: 'email', label: 'Email', placeholder: 'Email...', icon: Mail },
                  { key: 'telephone', label: 'Téléphone', placeholder: '+216...', icon: Phone },
                  { key: 'ville', label: 'Ville', placeholder: 'Tunis...', icon: MapPin },
                  { key: 'entreprise', label: 'Entreprise', placeholder: 'Entreprise...', icon: Building2 },
                ].map(({ key, label, placeholder, icon: Icon }) => (
                  <div key={key}>
                    <label className={`text-xs font-semibold tracking-wider uppercase mb-1.5 block ${muted}`}>
                      {label}
                    </label>
                    <div className="relative">
                      <Icon size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
                      <input
                        type="text"
                        value={editForm[key as keyof typeof editForm]}
                        onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className={`w-full h-10 pl-9 pr-3 border rounded-xl text-sm outline-none transition-all ${input}`}
                      />
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowEdit(false)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${
                      isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Annuler
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEdit}
                    disabled={editing}
                    className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #142588, #303f9f)' }}
                  >
                    {editing ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Save size={14} /> Sauvegarder
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Confirm Delete ════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {deleteId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl ${isDark ? 'bg-gray-900' : 'bg-white'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <Trash2 size={24} className="text-red-500" />
                </div>
                <h3 className="font-bold text-lg mb-1">Supprimer ce compte ?</h3>
                <p className={`text-sm ${muted}`}>
                  Cette action est irréversible. Toutes les données de cet utilisateur seront perdues.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteId(null)}
                  disabled={deleting}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold ${
                    isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors"
                >
                  {deleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Trash2 size={14} /> Supprimer
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}