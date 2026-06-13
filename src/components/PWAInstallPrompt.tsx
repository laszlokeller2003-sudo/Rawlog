/**
 * PWA Install Prompt — shows a banner encouraging mobile users to install RAWLOG.
 * Listens for the `beforeinstallprompt` event and provides a native install button.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null

export function PWAInstallPrompt() {
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('pwa-install-dismissed') === '1'
  })

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      if (!dismissed) setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [dismissed])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    deferredPrompt = null
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', '1')
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="install-banner"
        >
          <div className="w-10 h-10 rounded-xl bg-accent-red flex items-center justify-center flex-shrink-0">
            <span className="text-white font-heading font-black text-sm">RL</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[#F5F5F5] text-sm font-semibold leading-none mb-0.5">Add to Home Screen</p>
            <p className="text-[#888888] text-xs">Install RAWLOG for the full experience</p>
          </div>
          <button
            onClick={handleInstall}
            className="flex items-center gap-1 px-3 py-1.5 bg-accent-red text-white text-xs font-bold rounded-lg flex-shrink-0"
          >
            <Download size={12} />
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="w-6 h-6 flex items-center justify-center text-[#444444] hover:text-[#888888] flex-shrink-0"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
