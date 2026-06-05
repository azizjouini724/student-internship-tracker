import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [needsUpdate, setNeedsUpdate] = useState(false)

  useEffect(() => {
    // Détecter si déjà installé sur le PC
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    // Capturer l'événement d'installation du navigateur
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      console.log('💡 PWA install prompt captured')
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Détecter mise à jour
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setNeedsUpdate(true)
      })
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const installApp = async () => {
    if (!installPrompt) return false
    
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    
    if (outcome === 'accepted') {
      setIsInstalled(true)
      setInstallPrompt(null)
      return true
    }
    return false
  }

  const reloadForUpdate = () => {
    window.location.reload()
  }

  return {
    canInstall: !!installPrompt,
    isInstalled,
    needsUpdate,
    installApp,
    reloadForUpdate
  }
}