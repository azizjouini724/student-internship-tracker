import { usePWA } from '../hooks/usePWA'
import { Download, RefreshCw, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

export default function PWAProvider({ children }: { children: React.ReactNode }) {
  const { canInstall, isInstalled, needsUpdate, installApp, reloadForUpdate } = usePWA()
  const [dismissed, setDismissed] = useState(false)

  return (
    <>
      {children}
      
      {/* Banner d'installation sur PC */}
      <AnimatePresence>
        {canInstall && !isInstalled && !dismissed && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 right-4 w-96 z-50 bg-slate-800 border border-slate-600 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-4"
          >
            <Download size={24} className="text-blue-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold">Installer sur cet ordinateur</p>
              <p className="text-xs text-slate-400">Accès rapide hors navigateur.</p>
            </div>
            <button 
              onClick={installApp} 
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors"
            >
              Installer
            </button>
            <button onClick={() => setDismissed(true)} className="ml-1">
              <X size={16} className="text-slate-400 hover:text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup de mise à jour */}
      <AnimatePresence>
        {needsUpdate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          >
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl text-center">
              <RefreshCw size={40} className="mx-auto mb-3 text-green-500" />
              <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Mise à jour disponible</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Une nouvelle version est prête</p>
              <button 
                onClick={reloadForUpdate} 
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl font-bold transition-colors"
              >
                Actualiser
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}