import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Mail, Phone, MapPin, Clock,
  MessageSquare, ChevronDown, Send, Check,
  HelpCircle, BookOpen, AlertCircle, Loader2,
  ExternalLink, Shield, Zap
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast, Toaster } from 'sonner'
import api from '../services/api'

// ─── FAQ Data ────────────────────────────────────────────────────────────────
const FAQ = [
  {
    q: "Comment soumettre un rapport de stage ?",
    a: "Rendez-vous dans l'onglet 'Reports' de votre tableau de bord, cliquez sur 'Nouvelle soumission', remplissez le titre, choisissez votre encadrant et importez votre fichier (PDF, Word, etc.)."
  },
  {
    q: "Comment demander un encadrant ?",
    a: "Depuis votre dashboard, cliquez sur le bouton 'DEMANDER ENCADRANT' en haut à droite. Sélectionnez un encadrant dans la liste et envoyez votre message de demande."
  },
  {
    q: "Mon rapport a été rejeté, que faire ?",
    a: "Consultez les commentaires de votre encadrant dans le détail du rapport. Corrigez les points mentionnés puis soumettez une nouvelle version depuis la page Reports."
  },
  {
    q: "Comment modifier ma photo de profil ?",
    a: "Allez dans 'Profile', survolez votre photo et cliquez sur l'icône appareil photo. Vous pouvez importer une image depuis votre PC ou entrer une URL."
  },
  {
    q: "Je ne peux pas me connecter à mon compte.",
    a: "Vérifiez que votre email et mot de passe sont corrects. Si le problème persiste, contactez votre administrateur pour réinitialiser votre mot de passe."
  },
  {
    q: "Comment ajouter une deadline dans le calendrier ?",
    a: "Dans la page Profile, cliquez sur un jour du calendrier ou sur le bouton 'Ajouter'. Remplissez le titre, la date et cochez 'Importante' si nécessaire."
  },
]

// ─── Admin Contacts ───────────────────────────────────────────────────────────
const ADMINS = [
  {
    nom:      "Administration Principale",
    email:    "admin@dossier-pro.tn",
    phone:    "+216 71 000 001",
    role:     "Administrateur Général",
    avatar:   "A",
    color:    "from-blue-600 to-indigo-600",
    disponible: true,
  },
  {
    nom:      "Support Technique",
    email:    "support@dossier-pro.tn",
    phone:    "+216 71 000 002",
    role:     "Support & Technique",
    avatar:   "S",
    color:    "from-emerald-500 to-teal-600",
    disponible: true,
  },
  {
    nom:      "Coordination Pédagogique",
    email:    "pedagogy@dossier-pro.tn",
    phone:    "+216 71 000 003",
    role:     "Coordination des stages",
    avatar:   "C",
    color:    "from-purple-500 to-violet-600",
    disponible: false,
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function SupportPage() {
  const navigate  = useNavigate()
  const isDark    = localStorage.getItem('theme') === 'dark'
  const nom       = localStorage.getItem('nom') ?? 'Utilisateur'
  const email     = localStorage.getItem('email') ?? ''

  // ── FAQ ────────────────────────────────────────────────────────────────────
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // ── Formulaire contact ─────────────────────────────────────────────────────
  const [form, setForm] = useState({
    sujet:   '',
    type:    'question',
    message: '',
  })
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)

  const handleSend = async () => {
    if (!form.sujet.trim() || !form.message.trim()) {
      toast.error('Veuillez remplir le sujet et le message')
      return
    }
    setSending(true)
    try {
      const userId = localStorage.getItem('userId')
      await api.post('/support', {
        auteurId: userId,
        sujet:    form.sujet,
        type:     form.type,
        message:  form.message,
      })
      setSent(true)
      toast.success("Message envoyé ! L'équipe vous répondra sous 24h.")
      setForm({ sujet: '', type: 'question', message: '' })
      setTimeout(() => setSent(false), 4000)
    } catch {
      toast.error('Erreur lors de l\'envoi. Contactez l\'admin directement.')
    } finally {
      setSending(false)
    }
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const bg    = isDark ? 'bg-gray-950' : 'bg-[#f8f9ff]'
  const card  = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'
  const input = isDark
    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500 focus:border-blue-500'
    : 'bg-white border-slate-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10'
  const muted = isDark ? 'text-gray-400' : 'text-slate-500'

  return (
    <div className={`min-h-screen ${bg} ${isDark ? 'text-gray-100' : 'text-gray-900'} font-sans`}>
      <Toaster position="top-right" richColors />

      {/* ── Topbar ────────────────────────────────────────────────────────── */}
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
            <h1 className="text-lg font-bold tracking-tight">Support & Aide</h1>
            <p className={`text-xs ${muted}`}>Nous sommes là pour vous aider</p>
          </div>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl overflow-hidden p-8"
          style={{ background: 'linear-gradient(135deg, #091426 0%, #142588 60%, #303f9f 100%)' }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle size={20} className="text-blue-300" />
              <span className="text-blue-300 text-sm font-semibold tracking-wider uppercase">Centre d'aide</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Bonjour {nom.split(' ')[0]}, comment pouvons-nous vous aider ?
            </h2>
            <p className="text-blue-200/70 text-sm max-w-lg">
              Consultez la FAQ, contactez l'équipe administrative ou envoyez-nous un message directement.
            </p>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-6">
              {[
                { label: 'Temps de réponse',  val: '< 24h',     icon: Clock },
                { label: 'Disponibilité',     val: 'Lun–Ven',   icon: Shield },
                { label: 'Support technique', val: 'En ligne',   icon: Zap },
              ].map(({ label, val, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={14} className="text-blue-300 shrink-0" />
                  <div>
                    <p className="text-white text-sm font-bold">{val}</p>
                    <p className="text-blue-200/60 text-xs">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Déco */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-10">
            <HelpCircle size={140} className="text-white" />
          </div>
        </motion.div>

        {/* ── Grid principal ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ══ Colonne gauche (2/3) ══════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── FAQ ─────────────────────────────────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className={`rounded-2xl border p-6 ${card}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-blue-900/40' : 'bg-blue-50'}`}>
                  <BookOpen size={16} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold">Questions fréquentes</h2>
              </div>

              <div className="space-y-2">
                {FAQ.map((item, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-xl border overflow-hidden transition-all ${
                      openFaq === i
                        ? isDark ? 'border-blue-700 bg-blue-900/20' : 'border-blue-200 bg-blue-50/50'
                        : isDark ? 'border-gray-800 bg-gray-800/50' : 'border-slate-100 bg-slate-50/50'
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                    >
                      <span className={`text-sm font-medium ${openFaq === i ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {item.q}
                      </span>
                      <motion.div
                        animate={{ rotate: openFaq === i ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0 ml-3"
                      >
                        <ChevronDown size={15} className={muted} />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {openFaq === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className={`px-4 pb-4 text-sm leading-relaxed ${muted}`}>
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* ── Formulaire contact ───────────────────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className={`rounded-2xl border p-6 ${card}`}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
                  <MessageSquare size={16} className="text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold">Envoyer un message</h2>
              </div>

              <div className="space-y-4">
                {/* Type de demande */}
                <div>
                  <label className={`text-xs font-semibold tracking-wider uppercase mb-2 block ${muted}`}>
                    Type de demande
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'question',  label: '❓ Question',   },
                      { val: 'bug',       label: '🐛 Bug / Erreur' },
                      { val: 'autre',     label: '📋 Autre'        },
                    ].map(({ val, label }) => (
                      <button key={val} onClick={() => setForm(p => ({ ...p, type: val }))}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold border-2 transition-all ${
                          form.type === val
                            ? 'border-blue-500 bg-blue-600 text-white'
                            : isDark ? 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'
                                     : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                        }`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sujet */}
                <div>
                  <label className={`text-xs font-semibold tracking-wider uppercase mb-1.5 block ${muted}`}>
                    Sujet *
                  </label>
                  <input type="text" value={form.sujet}
                    onChange={e => setForm(p => ({ ...p, sujet: e.target.value }))}
                    placeholder="Ex: Problème de connexion, rapport non soumis..."
                    className={`w-full h-10 px-4 border rounded-xl text-sm outline-none transition-all ${input}`}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className={`text-xs font-semibold tracking-wider uppercase mb-1.5 flex items-center justify-between ${muted}`}>
                    <span>Message *</span>
                    <span className={form.message.length > 20 ? 'text-emerald-500' : ''}>{form.message.length} car.</span>
                  </label>
                  <textarea value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Décrivez votre problème en détail..."
                    rows={5}
                    className={`w-full px-4 py-3 border rounded-xl text-sm outline-none resize-none transition-all ${input}`}
                  />
                </div>

                {/* Info auto */}
                <div className={`flex items-start gap-2 text-xs px-3 py-2.5 rounded-xl ${isDark ? 'bg-gray-800 text-gray-400' : 'bg-slate-50 text-slate-500'}`}>
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  Votre message sera envoyé avec votre nom ({nom}) et sera traité sous 24h ouvrées.
                </div>

                {/* Bouton */}
                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSend} disabled={sending || sent}
                  className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-all"
                  style={{ background: sent ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #142588, #303f9f)' }}
                >
                  {sending
                    ? <Loader2 size={16} className="animate-spin" />
                    : sent
                    ? <><Check size={15} /> Message envoyé !</>
                    : <><Send size={15} /> Envoyer le message</>
                  }
                </motion.button>
              </div>
            </motion.section>
          </div>

          {/* ══ Colonne droite (1/3) ══════════════════════════════════════════ */}
          <div className="space-y-5">

            {/* ── Contacts admins ──────────────────────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className={`rounded-2xl border p-5 ${card}`}
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Mail size={15} className="text-blue-500" /> Contacts administrateurs
              </h3>

              <div className="space-y-4">
                {ADMINS.map((admin, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className={`rounded-xl p-4 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${admin.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                        {admin.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold truncate">{admin.nom}</p>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${admin.disponible ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                        </div>
                        <p className={`text-xs ${muted} mb-2`}>{admin.role}</p>

                        {/* Email */}
                        <a href={`mailto:${admin.email}`}
                          className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline mb-1">
                          <Mail size={11} />
                          <span className="truncate">{admin.email}</span>
                          <ExternalLink size={10} className="shrink-0" />
                        </a>

                        {/* Téléphone */}
                        <a href={`tel:${admin.phone}`}
                          className={`flex items-center gap-1.5 text-xs hover:underline ${muted}`}>
                          <Phone size={11} />
                          {admin.phone}
                        </a>
                      </div>
                    </div>

                    {/* Disponibilité */}
                    <div className={`mt-3 text-xs flex items-center gap-1.5 ${admin.disponible ? 'text-emerald-600 dark:text-emerald-400' : muted}`}>
                      <Clock size={10} />
                      {admin.disponible ? 'Disponible maintenant' : 'Hors ligne'}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* ── Infos pratiques ──────────────────────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className={`rounded-2xl border p-5 ${card}`}
            >
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin size={15} className="text-purple-500" /> Informations pratiques
              </h3>

              <div className="space-y-3">
                {[
                  { icon: MapPin,  label: 'Adresse',    val: 'Campus Universitaire, Tunis' },
                  { icon: Clock,   label: 'Horaires',   val: 'Lun–Ven : 8h00 – 17h00' },
                  { icon: Phone,   label: 'Standard',   val: '+216 71 000 000' },
                  { icon: Mail,    label: 'Email',       val: 'contact@dossier-pro.tn' },
                ].map(({ icon: Icon, label, val }) => (
                  <div key={label} className={`flex items-start gap-3 py-2 border-b last:border-0 ${isDark ? 'border-gray-800' : 'border-slate-100'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
                      <Icon size={13} className={muted} />
                    </div>
                    <div>
                      <p className={`text-xs ${muted}`}>{label}</p>
                      <p className="text-sm font-medium mt-0.5">{val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* ── Urgence ───────────────────────────────────────────────────── */}
            <motion.section
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className={`rounded-2xl p-5 border-2 ${isDark ? 'border-red-900/50 bg-red-900/10' : 'border-red-100 bg-red-50'}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-red-500" />
                <h3 className="text-sm font-bold text-red-600 dark:text-red-400">Urgence technique</h3>
              </div>
              <p className={`text-xs mb-3 ${muted}`}>
                Si vous avez un problème urgent (perte d'accès, deadline proche), contactez directement :
              </p>
              <a href="mailto:urgent@dossier-pro.tn"
                className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors">
                <Mail size={12} /> urgent@dossier-pro.tn
              </a>
            </motion.section>

          </div>
        </div>
      </main>
    </div>
  )
}