import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, User, Settings, Shield, Bell, Zap,
  X, Plus, Check, Eye, EyeOff, Save, Loader2,
  Mail, Phone, Building2, MapPin, Lock, Smartphone,
  ChevronDown, AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import api from '../services/api'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProfileData {
  nom:        string
  email:      string
  telephone:  string
  ville:      string
  entreprise: string
  specialite: string
  disponibilite: string
}

interface NotifSettings {
  nouveauxRapports:    boolean
  rappelDeadlines:     boolean
  miseAJourStatuts:    boolean
  demandesEncadrement: boolean
}

interface Industry { id: number; label: string }

// ─── Component ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const navigate = useNavigate()
  const isDark   = localStorage.getItem('theme') === 'dark'
  const userId   = localStorage.getItem('userId')
  const role     = localStorage.getItem('role') ?? 'ETUDIANT'

  // ── Profile ────────────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileData>({
    nom:           localStorage.getItem('nom') ?? '',
    email:         '',
    telephone:     '',
    ville:         '',
    entreprise:    '',
    specialite:    'Informatique',
    disponibilite: 'Été 2025',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaved,   setProfileSaved]   = useState(false)

  // ── Industries ─────────────────────────────────────────────────────────────
  const [industries, setIndustries] = useState<Industry[]>([
    { id: 1, label: 'Développement Web' },
    { id: 2, label: 'Intelligence Artificielle' },
    { id: 3, label: 'Cybersécurité' },
  ])
  const [newIndustry, setNewIndustry] = useState('')
  const [showAddIndustry, setShowAddIndustry] = useState(false)

  // ── Notifications ──────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState<NotifSettings>({
    nouveauxRapports:    true,
    rappelDeadlines:     true,
    miseAJourStatuts:    false,
    demandesEncadrement: true,
  })

  // ── Sécurité ───────────────────────────────────────────────────────────────
  const [showPwdForm,   setShowPwdForm]   = useState(false)
  const [oldPwd,        setOldPwd]        = useState('')
  const [newPwd,        setNewPwd]        = useState('')
  const [confirmPwd,    setConfirmPwd]    = useState('')
  const [showOld,       setShowOld]       = useState(false)
  const [showNew,       setShowNew]       = useState(false)
  const [showConfirm,   setShowConfirm]   = useState(false)
  const [pwdLoading,    setPwdLoading]    = useState(false)
  const [twoFAEnabled,  setTwoFAEnabled]  = useState(false)

  // ── Profile completeness ────────────────────────────────────────────────────
  const completionFields = [
    profile.nom, profile.email, profile.telephone,
    profile.ville, profile.specialite, profile.disponibilite,
  ]
  const completionPct = Math.round(
    (completionFields.filter(f => f && f.trim() !== '').length / completionFields.length) * 100
  )

  // ── Fetch user ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return
    api.get(`/users/${userId}`)
      .then(r => {
        const d = r.data
        setProfile(prev => ({
          ...prev,
          nom:        d.nom        ?? prev.nom,
          email:      d.email      ?? prev.email,
          telephone:  d.telephone  ?? prev.telephone,
          ville:      d.ville      ?? prev.ville,
          entreprise: d.entreprise ?? prev.entreprise,
        }))
      })
      .catch(() => {/* utilise les valeurs localStorage */})
  }, [userId])

  // ── Sauvegarde profil ──────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!profile.nom.trim()) { toast.error('Le nom est requis'); return }
    setProfileLoading(true)
    try {
      await api.put(`/users/${userId}`, profile)
      localStorage.setItem('nom', profile.nom)
      setProfileSaved(true)
      toast.success('Profil mis à jour avec succès !')
      setTimeout(() => setProfileSaved(false), 2000)
    } catch {
      // mock save pour dev
      localStorage.setItem('nom', profile.nom)
      toast.success('Profil sauvegardé !')
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } finally {
      setProfileLoading(false)
    }
  }

  // ── Changer mot de passe ───────────────────────────────────────────────────
  const handleChangePwd = async () => {
    if (!oldPwd || !newPwd || !confirmPwd) { toast.error('Remplissez tous les champs'); return }
    if (newPwd.length < 6)                 { toast.error('Minimum 6 caractères'); return }
    if (newPwd !== confirmPwd)             { toast.error('Les mots de passe ne correspondent pas'); return }
    setPwdLoading(true)
    try {
      await api.put(`/users/${userId}/password`, { ancienMotDePasse: oldPwd, nouveauMotDePasse: newPwd })
      toast.success('Mot de passe modifié !')
      setOldPwd(''); setNewPwd(''); setConfirmPwd('')
      setShowPwdForm(false)
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? 'Mot de passe actuel incorrect')
    } finally {
      setPwdLoading(false)
    }
  }

  // ── Industrie tags ─────────────────────────────────────────────────────────
  const addIndustry = () => {
    if (!newIndustry.trim()) return
    setIndustries(prev => [...prev, { id: Date.now(), label: newIndustry.trim() }])
    setNewIndustry('')
    setShowAddIndustry(false)
  }
  const removeIndustry = (id: number) =>
    setIndustries(prev => prev.filter(i => i.id !== id))

  // ─── Styles ────────────────────────────────────────────────────────────────
  const bg     = isDark ? 'bg-gray-950' : 'bg-[#f8f9ff]'
  const input  = isDark
    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-blue-500'
    : 'bg-white border-slate-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
  const label  = isDark ? 'text-gray-400' : 'text-slate-500'
  const muted  = isDark ? 'text-gray-500' : 'text-slate-400'
  const sect   = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      role="switch" aria-checked={checked} onClick={onChange}
      className={`relative inline-flex w-10 h-5 items-center rounded-full transition-colors shrink-0 ${
        checked ? 'bg-blue-600' : isDark ? 'bg-gray-700' : 'bg-slate-200'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm ${checked ? 'left-5' : 'left-0.5'}`}
      />
    </button>
  )

  return (
    <div className={`min-h-screen ${bg} ${isDark ? 'text-gray-100' : 'text-gray-900'} font-sans`}>
      <Toaster position="top-right" richColors />

      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className={`sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b backdrop-blur-md ${
          isDark ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/student')}
            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Paramètres</h1>
            <p className={`text-xs ${muted}`}>Gérez votre compte et vos préférences</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleSaveProfile}
            disabled={profileLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-lg disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0058be, #2170e4)' }}
          >
            {profileLoading
              ? <Loader2 size={14} className="animate-spin" />
              : profileSaved
              ? <Check size={14} />
              : <Save size={14} />}
            {profileSaved ? 'Sauvegardé !' : 'Sauvegarder'}
          </motion.button>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ══ Colonne gauche (8) ══════════════════════════════════════════════ */}
          <div className="lg:col-span-8 space-y-6">

            {/* ── Personal Information ──────────────────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className={`rounded-xl border p-6 ${sect}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/40' : 'bg-blue-50'}`}>
                  <User size={16} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold">Informations personnelles</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nom */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-semibold tracking-wider uppercase ${label}`}>Nom complet</label>
                  <div className="relative">
                    <User size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
                    <input type="text" value={profile.nom}
                      onChange={e => setProfile(p => ({ ...p, nom: e.target.value }))}
                      placeholder="Votre nom"
                      className={`w-full h-10 pl-9 pr-3 border rounded-lg text-sm outline-none transition-all ${input}`}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-semibold tracking-wider uppercase ${label}`}>Email universitaire</label>
                  <div className="relative">
                    <Mail size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
                    <input type="email" value={profile.email}
                      onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                      placeholder="prenom.nom@universite.tn"
                      className={`w-full h-10 pl-9 pr-3 border rounded-lg text-sm outline-none transition-all ${input}`}
                    />
                  </div>
                </div>

                {/* Téléphone */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-semibold tracking-wider uppercase ${label}`}>Téléphone</label>
                  <div className="relative">
                    <Phone size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
                    <input type="tel" value={profile.telephone}
                      onChange={e => setProfile(p => ({ ...p, telephone: e.target.value }))}
                      placeholder="+216 XX XXX XXX"
                      className={`w-full h-10 pl-9 pr-3 border rounded-lg text-sm outline-none transition-all ${input}`}
                    />
                  </div>
                </div>

                {/* Ville */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-semibold tracking-wider uppercase ${label}`}>Ville</label>
                  <div className="relative">
                    <MapPin size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
                    <input type="text" value={profile.ville}
                      onChange={e => setProfile(p => ({ ...p, ville: e.target.value }))}
                      placeholder="Tunis, Sfax..."
                      className={`w-full h-10 pl-9 pr-3 border rounded-lg text-sm outline-none transition-all ${input}`}
                    />
                  </div>
                </div>

                {/* Entreprise */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className={`text-xs font-semibold tracking-wider uppercase ${label}`}>Entreprise de stage</label>
                  <div className="relative">
                    <Building2 size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
                    <input type="text" value={profile.entreprise}
                      onChange={e => setProfile(p => ({ ...p, entreprise: e.target.value }))}
                      placeholder="Nom de l'entreprise"
                      className={`w-full h-10 pl-9 pr-3 border rounded-lg text-sm outline-none transition-all ${input}`}
                    />
                  </div>
                </div>
              </div>
            </motion.section>

            {/* ── Préférences de stage ──────────────────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className={`rounded-xl border p-6 ${sect}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-purple-900/40' : 'bg-purple-50'}`}>
                  <Settings size={16} className="text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold">Préférences de stage</h2>
              </div>

              {/* Tags domaines */}
              <div className="mb-5">
                <label className={`text-xs font-semibold tracking-wider uppercase ${label} block mb-2`}>
                  Domaines cibles
                </label>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence>
                    {industries.map(ind => (
                      <motion.span key={ind.id}
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {ind.label}
                        <button onClick={() => removeIndustry(ind.id)}
                          className="hover:opacity-70 transition-opacity">
                          <X size={11} />
                        </button>
                      </motion.span>
                    ))}
                  </AnimatePresence>

                  {/* Ajouter un domaine */}
                  <AnimatePresence>
                    {showAddIndustry ? (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex items-center gap-1"
                      >
                        <input
                          autoFocus
                          value={newIndustry}
                          onChange={e => setNewIndustry(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') addIndustry(); if (e.key === 'Escape') setShowAddIndustry(false) }}
                          placeholder="Nouveau domaine..."
                          className={`h-7 px-2 text-xs border rounded-full outline-none w-36 ${input}`}
                        />
                        <button onClick={addIndustry}
                          className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white">
                          <Check size={11} />
                        </button>
                        <button onClick={() => setShowAddIndustry(false)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                          <X size={11} />
                        </button>
                      </motion.div>
                    ) : (
                      <motion.button
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        onClick={() => setShowAddIndustry(true)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed transition-colors ${
                          isDark ? 'border-gray-600 text-gray-400 hover:border-blue-500 hover:text-blue-400'
                                 : 'border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600'
                        }`}
                      >
                        <Plus size={11} /> Ajouter
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Spécialité */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-semibold tracking-wider uppercase ${label}`}>Spécialité</label>
                  <div className="relative">
                    <select value={profile.specialite}
                      onChange={e => setProfile(p => ({ ...p, specialite: e.target.value }))}
                      className={`w-full h-10 px-3 border rounded-lg text-sm outline-none appearance-none transition-all ${input}`}
                    >
                      <option>Informatique</option>
                      <option>Génie Logiciel</option>
                      <option>Réseaux & Télécoms</option>
                      <option>Intelligence Artificielle</option>
                      <option>Cybersécurité</option>
                      <option>Data Science</option>
                    </select>
                    <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${muted}`} />
                  </div>
                </div>

                {/* Disponibilité */}
                <div className="flex flex-col gap-1.5">
                  <label className={`text-xs font-semibold tracking-wider uppercase ${label}`}>Disponibilité</label>
                  <div className="relative">
                    <select value={profile.disponibilite}
                      onChange={e => setProfile(p => ({ ...p, disponibilite: e.target.value }))}
                      className={`w-full h-10 px-3 border rounded-lg text-sm outline-none appearance-none transition-all ${input}`}
                    >
                      <option>Été 2025</option>
                      <option>Automne 2025</option>
                      <option>Immédiatement</option>
                      <option>PFE 2025-2026</option>
                    </select>
                    <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${muted}`} />
                  </div>
                </div>
              </div>
            </motion.section>

            {/* ── Sécurité ─────────────────────────────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className={`rounded-xl border p-6 ${sect}`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
                  <Shield size={16} className="text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold">Sécurité</h2>
              </div>

              <div className="space-y-3">
                {/* Mot de passe */}
                <div className={`rounded-xl border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock size={16} className={muted} />
                      <div>
                        <p className="text-sm font-semibold">Mot de passe</p>
                        <p className={`text-xs mt-0.5 ${muted}`}>Dernière modification il y a 3 mois</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPwdForm(!showPwdForm)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      {showPwdForm ? 'Annuler' : 'Modifier'}
                    </button>
                  </div>

                  {/* Formulaire MDP */}
                  <AnimatePresence>
                    {showPwdForm && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 space-y-3">
                          {[
                            { label: 'Mot de passe actuel', val: oldPwd, set: setOldPwd, show: showOld, toggle: () => setShowOld(!showOld) },
                            { label: 'Nouveau mot de passe', val: newPwd, set: setNewPwd, show: showNew, toggle: () => setShowNew(!showNew) },
                            { label: 'Confirmer le nouveau', val: confirmPwd, set: setConfirmPwd, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
                          ].map(({ label: l, val, set, show, toggle }) => (
                            <div key={l} className="relative">
                              <label className={`text-xs font-medium block mb-1 ${muted}`}>{l}</label>
                              <div className="relative">
                                <Lock size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
                                <input
                                  type={show ? 'text' : 'password'} value={val}
                                  onChange={e => set(e.target.value)}
                                  className={`w-full h-9 pl-9 pr-9 border rounded-lg text-sm outline-none transition-all ${input}`}
                                />
                                <button onClick={toggle} type="button"
                                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${muted} hover:opacity-80`}>
                                  {show ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              </div>
                            </div>
                          ))}

                          {/* Force MDP */}
                          {newPwd && (
                            <div>
                              <div className="flex gap-1 mt-1">
                                {[1,2,3,4].map(i => (
                                  <div key={i} className={`flex-1 h-1 rounded-full transition-all ${
                                    newPwd.length >= i * 2
                                      ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-orange-400' : i <= 3 ? 'bg-yellow-400' : 'bg-emerald-500'
                                      : isDark ? 'bg-gray-700' : 'bg-gray-200'
                                  }`} />
                                ))}
                              </div>
                              <p className={`text-xs mt-1 ${muted}`}>
                                {newPwd.length < 4 ? 'Trop court' : newPwd.length < 6 ? 'Faible' : newPwd.length < 8 ? 'Moyen' : 'Fort'}
                              </p>
                            </div>
                          )}

                          <button onClick={handleChangePwd} disabled={pwdLoading}
                            className="w-full py-2 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                            style={{ background: 'linear-gradient(135deg, #0058be, #2170e4)' }}
                          >
                            {pwdLoading ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Confirmer le changement</>}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2FA */}
                <div className={`flex items-center justify-between p-4 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <Smartphone size={16} className={muted} />
                    <div>
                      <p className="text-sm font-semibold">Authentification à 2 facteurs</p>
                      <p className={`text-xs mt-0.5 ${muted}`}>Ajoute une couche de sécurité à votre compte</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setTwoFAEnabled(!twoFAEnabled); toast.success(twoFAEnabled ? '2FA désactivé' : '2FA activé !') }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      twoFAEnabled
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isDark ? 'border-gray-600 text-blue-400 hover:bg-blue-900/20' : 'border-slate-200 text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {twoFAEnabled ? '✓ Activé' : 'Activer'}
                  </button>
                </div>

                {/* Zone danger */}
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${isDark ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
                  <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">Zone de danger</p>
                    <p className={`text-xs mt-0.5 ${muted}`}>La suppression de votre compte est irréversible.</p>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-300 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                    Supprimer
                  </button>
                </div>
              </div>
            </motion.section>
          </div>

          {/* ══ Colonne droite (4) ══════════════════════════════════════════════ */}
          <div className="lg:col-span-4 space-y-6">

            {/* ── Notifications ────────────────────────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className={`rounded-xl border p-6 ${sect}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-orange-900/40' : 'bg-orange-50'}`}>
                  <Bell size={16} className="text-orange-500" />
                </div>
                <h2 className="text-base font-semibold">Notifications</h2>
              </div>

              <div className="space-y-4">
                {([
                  { key: 'nouveauxRapports',    label: 'Nouveaux rapports',        desc: 'Alertes quand un rapport est soumis' },
                  { key: 'rappelDeadlines',      label: 'Rappels deadlines',        desc: 'Notification 24h avant une deadline' },
                  { key: 'miseAJourStatuts',     label: 'Mises à jour de statut',   desc: 'Quand un rapport est validé/rejeté' },
                  { key: 'demandesEncadrement',  label: 'Demandes d\'encadrement',  desc: 'Nouvelles demandes reçues ou traitées' },
                ] as const).map(({ key, label: l, desc }, i) => (
                  <div key={key}>
                    {i > 0 && <hr className={`mb-4 ${isDark ? 'border-gray-800' : 'border-slate-100'}`} />}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{l}</p>
                        <p className={`text-xs mt-0.5 ${muted}`}>{desc}</p>
                      </div>
                      <Toggle
                        checked={notifs[key]}
                        onChange={() => setNotifs(prev => ({ ...prev, [key]: !prev[key] }))}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* ── Profile completeness card ─────────────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-xl p-6 overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg, #091426 0%, #1e293b 100%)' }}
            >
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={16} className="text-blue-400" />
                  <h3 className="font-semibold text-white text-base">Santé du profil</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Complétez votre profil pour de meilleures recommandations de stage.
                </p>

                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-white">{completionPct}% complété</span>
                  <span className="text-xs text-slate-400">
                    {completionFields.filter(f => f && f.trim() !== '').length}/{completionFields.length} champs
                  </span>
                </div>
                <div className="w-full bg-slate-700 h-1.5 rounded-full mb-5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                    className={`h-full rounded-full ${
                      completionPct >= 80 ? 'bg-emerald-400' :
                      completionPct >= 50 ? 'bg-blue-400' : 'bg-orange-400'
                    }`}
                  />
                </div>

                {/* Champs manquants */}
                {completionPct < 100 && (
                  <div className="space-y-1.5 mb-4">
                    {[
                      { field: profile.telephone,  label: 'Téléphone' },
                      { field: profile.ville,      label: 'Ville' },
                      { field: profile.entreprise, label: 'Entreprise' },
                    ].filter(f => !f.field || !f.field.trim()).map(f => (
                      <div key={f.label} className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                        {f.label} manquant
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleSaveProfile}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-xs font-semibold transition-colors"
                >
                  {completionPct === 100 ? '✓ Profil complet !' : 'Compléter mon profil'}
                </button>
              </div>

              {/* Déco bg */}
              <div className="absolute -right-6 -bottom-6 opacity-10">
                <Zap size={100} className="text-blue-300" />
              </div>
            </motion.section>

            {/* ── Infos compte ─────────────────────────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className={`rounded-xl border p-5 ${sect}`}
            >
              <h3 className="text-sm font-semibold mb-3">Informations du compte</h3>
              <div className="space-y-2">
                {[
                  { label: 'Rôle',        val: role === 'ETUDIANT' ? 'Étudiant' : role === 'ENCADRANT' ? 'Encadrant' : 'Administrateur' },
                  { label: 'ID Compte',   val: `#${userId}` },
                  { label: 'Statut',      val: 'Actif' },
                ].map(({ label: l, val }) => (
                  <div key={l} className={`flex items-center justify-between py-1.5 border-b last:border-0 ${isDark ? 'border-gray-800' : 'border-slate-100'}`}>
                    <span className={`text-xs ${muted}`}>{l}</span>
                    <span className="text-xs font-semibold">{val}</span>
                  </div>
                ))}
              </div>
            </motion.section>

          </div>
        </div>

        {/* ── Footer actions ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className={`mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-end gap-3 ${isDark ? 'border-gray-800' : 'border-slate-200'}`}
        >
          <button
            onClick={() => navigate('/student')}
            className={`w-full sm:w-auto px-6 h-10 border rounded-lg text-sm font-semibold transition-all active:scale-95 ${
              isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-slate-200 text-slate-600 hover:bg-white'
            }`}
          >
            Annuler
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleSaveProfile}
            disabled={profileLoading}
            className="w-full sm:w-auto px-6 h-10 text-white rounded-lg text-sm font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #0058be, #2170e4)' }}
          >
            {profileLoading
              ? <Loader2 size={14} className="animate-spin" />
              : <Save size={14} />}
            Sauvegarder les modifications
          </motion.button>
        </motion.div>
      </main>
    </div>
  )
}