import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const handleLogin = async () => {
  if (!form.email || !form.password) {
    toast.error('Veuillez remplir tous les champs')
    return
  }
  setLoading(true)
  try {
    const data = await authService.login(form.email, form.password)
    setAuth(data.token, data.role, form.email)
    toast.success('Connexion réussie !')
    setTimeout(() => {
      if (data.role === 'ETUDIANT') navigate('/student')
      else if (data.role === 'ENCADRANT') navigate('/supervisor')
      else navigate('/admin')
    }, 1000)
  } catch (error) {
    toast.error('Email ou mot de passe incorrect')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-surface dark:bg-gray-950 flex items-center justify-center p-4">
      <Toaster position="top-right" richColors />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden shadow-2xl">

        {/* LEFT — Hero Panel */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative p-10 flex flex-col justify-between min-h-[500px]"
          style={{ background: 'linear-gradient(135deg, #142588 0%, #303f9f 100%)' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg tracking-wide">
              DOSSIER PRO
            </span>
          </div>

          {/* Hero Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h1
              className="text-4xl font-bold text-white leading-tight mb-4"
              style={{ letterSpacing: '-0.02em' }}
            >
              The Architectural Standard for Internships.
            </h1>
            <p className="text-white/70 text-base leading-relaxed">
              A curated environment for career-defining connections between institutions and emerging talent.
            </p>
          </motion.div>

          {/* Bottom Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-3 bg-white/10 rounded-xl p-3 backdrop-blur-sm"
          >
            <div className="flex -space-x-2">
              {['bg-blue-400', 'bg-purple-400', 'bg-pink-400'].map((c, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-white/30`} />
              ))}
            </div>
            <p className="text-white/80 text-sm">
              Joined by 2,000+ supervisors this term
            </p>
          </motion.div>

          {/* Decorative */}
          <div className="absolute top-20 right-10 w-32 h-32 bg-white/5 rounded-full blur-xl" />
          <div className="absolute bottom-20 right-5 w-20 h-20 bg-white/5 rounded-full blur-lg" />
        </motion.div>

        {/* RIGHT — Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white dark:bg-gray-900 p-10 flex flex-col justify-center"
        >
          <h2
            className="text-2xl font-bold text-gray-900 dark:text-white mb-1"
            style={{ letterSpacing: '-0.02em' }}
          >
            Welcome Back
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            Please enter your credentials to access your dossier.
          </p>

          {/* Email */}
          <div className="mb-4">
            <label className="text-xs text-gray-400 tracking-widest uppercase mb-2 block">
              Professional Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                placeholder="name@organization.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-blue-50 dark:bg-gray-800 text-gray-800 dark:text-white pl-10 pr-4 py-3 rounded-t-md border-b-2 border-transparent focus:border-primary outline-none text-sm transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400 tracking-widest uppercase">
                Security Key
              </label>
              <button className="text-xs text-primary font-medium hover:opacity-70 transition-opacity">
                FORGOT?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-blue-50 dark:bg-gray-800 text-gray-800 dark:text-white pl-10 pr-10 py-3 rounded-t-md border-b-2 border-transparent focus:border-primary outline-none text-sm transition-all"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 rounded-lg text-white text-sm font-semibold tracking-widest uppercase transition-all disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #142588, #303f9f)' }}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mx-auto"
              />
            ) : (
              'AUTHORIZE ACCESS'
            )}
          </motion.button>

          <p className="text-center text-xs text-gray-400 mt-6">
            Contact your administrator to get access.
          </p>
        </motion.div>
      </div>
    </div>
  )
}