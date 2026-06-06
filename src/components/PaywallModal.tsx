import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const FEATURES = [
  'Full stats history (all time)',
  'All 4 specialized dashboards',
  'Unlimited habits + goals',
  'AI PA Chat (unlimited messages)',
  'AI Insights + auto reports',
  'Cloud sync across devices',
  'Data export (JSON + CSV)',
  'App lock (PIN)',
]

export function PaywallModal() {
  const { isPaywallOpen, paywallFeature, closePaywall } = useUIStore()
  const { updateProfile } = useProfileStore()

  const handleActivatePremium = () => {
    updateProfile({ isPremium: true })
    closePaywall()
    toast.success('🎉 Premium activated! (demo mode)')
  }

  return (
    <AnimatePresence>
      {isPaywallOpen && (
        <motion.div
          key="paywall-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/90 z-50 overflow-y-auto"
        >
          <motion.div
            key="paywall-content"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="max-w-[430px] mx-auto min-h-full flex flex-col p-6"
          >
            {/* Close button */}
            <div className="flex justify-end mb-6">
              <button
                onClick={closePaywall}
                className="w-8 h-8 flex items-center justify-center text-[#888888] hover:text-[#F5F5F5] transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Logo */}
            <div className="mb-2">
              <h1 className="font-heading font-extrabold text-[32px] leading-none tracking-tight text-accent-red">
                RAWLOG
              </h1>
            </div>

            {/* Headline */}
            <h2 className="font-heading font-bold text-[22px] text-[#F5F5F5] mb-2 leading-tight">
              Used by people who take their life seriously.
            </h2>

            {paywallFeature && (
              <p className="text-[#888888] text-sm mb-6">
                Unlock{' '}
                <span className="text-accent-red font-medium">{paywallFeature}</span>{' '}
                with Premium
              </p>
            )}

            {!paywallFeature && <div className="mb-6" />}

            {/* Feature list */}
            <ul className="space-y-3 mb-8">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-green-500" />
                  </div>
                  <span className="text-[#F5F5F5] text-sm font-body">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Pricing cards */}
            <div className="flex gap-3 mb-6">
              {/* Monthly */}
              <div className="flex-1 border border-border rounded-lg p-4 text-center">
                <p className="text-[#888888] text-xs font-heading uppercase tracking-wider mb-2">Monthly</p>
                <p className="font-mono font-bold text-[28px] text-[#F5F5F5] leading-none">4.99€</p>
                <p className="text-[#444444] text-xs mt-1">/month</p>
              </div>

              {/* Yearly (highlighted) */}
              <div className="flex-1 border-2 border-accent-red rounded-lg p-4 text-center relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-accent-red text-white text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                    Save 33%
                  </span>
                </div>
                <p className="text-[#888888] text-xs font-heading uppercase tracking-wider mb-2">Yearly</p>
                <p className="font-mono font-bold text-[28px] text-[#F5F5F5] leading-none">39.99€</p>
                <p className="text-[#444444] text-xs mt-1">/year</p>
              </div>
            </div>

            {/* CTA button */}
            <button
              onClick={handleActivatePremium}
              className="w-full bg-accent-red text-white font-heading font-bold text-base py-4 rounded-lg mb-3 hover:bg-red-600 transition-colors active:scale-[0.98]"
            >
              Start Premium
            </button>

            {/* Restore */}
            <button
              onClick={() => toast('Restore purchase coming soon', { icon: '🔄' })}
              className="w-full text-[#888888] text-sm py-2 hover:text-[#F5F5F5] transition-colors"
            >
              Restore purchase
            </button>

            {/* Cancel */}
            <button
              onClick={closePaywall}
              className="w-full text-[#444444] text-xs py-3 hover:text-[#888888] transition-colors mt-auto pt-6"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
