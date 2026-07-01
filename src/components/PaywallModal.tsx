import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { X, Check, Crown, Zap, Shield, RefreshCw } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { isTrialActive } from '@/lib/utils'
import toast from 'react-hot-toast'

const FEATURE_ICONS_KEYS: Array<{ icon: string; key: string }> = [
  { icon: '📊', key: 'paywall.features.stats' },
  { icon: '🎯', key: 'paywall.features.dashboards' },
  { icon: '♾️', key: 'paywall.features.habits' },
  { icon: '🤖', key: 'paywall.features.chat' },
  { icon: '💡', key: 'paywall.features.insights' },
  { icon: '☁️', key: 'paywall.features.sync' },
  { icon: '📤', key: 'paywall.features.export' },
  { icon: '🔒', key: 'paywall.features.lock' },
]

export function PaywallModal() {
  const { t } = useTranslation()
  const { isPaywallOpen, paywallFeature, closePaywall } = useUIStore()
  const { profile, updateProfile } = useProfileStore()
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly')
  const [isLoading, setIsLoading] = useState(false)

  const PLANS = [
    {
      id: 'monthly',
      label: t('paywall.monthly'),
      price: '4.99€',
      period: '/month',
      priceId: 'price_monthly_lyfe',
      highlight: false,
      badge: null as string | null,
    },
    {
      id: 'yearly',
      label: t('paywall.yearly'),
      price: '39.99€',
      period: '/year',
      priceId: 'price_yearly_lyfe',
      highlight: true,
      badge: t('paywall.saveBadge') as string | null,
    },
  ]

  // openPaywall() callers pass either a dashboard id or a raw English phrase —
  // map the known values to translated labels instead of leaking English/ids
  // into an otherwise localized sentence.
  const FEATURE_LABEL_KEYS: Record<string, string> = {
    finance: 'dashboards.finance',
    body: 'dashboards.body',
    relationships: 'dashboards.relations',
    productivity: 'dashboards.work',
    'unlimited AI chat': 'paywall.featureUnlimitedChat',
    unlimited_habits: 'paywall.featureUnlimitedHabits',
    unlimited_goals: 'paywall.featureUnlimitedGoals',
  }
  const translatedFeature = paywallFeature
    ? t(FEATURE_LABEL_KEYS[paywallFeature] ?? '', { defaultValue: paywallFeature })
    : null

  const trialActive = isTrialActive(profile.trialStartedAt)
  const trialDaysLeft = profile.trialStartedAt
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(profile.trialStartedAt).getTime()) / 86400000))
    : 0

  const handleSubscribe = async () => {
    setIsLoading(true)
    try {
      const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

      if (stripeKey && stripeKey !== 'pk_test_your_stripe_key_here') {
        // Real Stripe checkout
        const { loadStripe } = await import('@stripe/stripe-js')
        const stripe = await loadStripe(stripeKey)
        if (!stripe) throw new Error('Stripe failed to load')

        const plan = PLANS.find((p) => p.id === selectedPlan)!
        // Create checkout session via Supabase Edge Function
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        if (supabaseUrl) {
          const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priceId: plan.priceId, successUrl: window.location.href, cancelUrl: window.location.href }),
          })
          const { sessionId } = await res.json()
          if (sessionId) {
            await (stripe as any).redirectToCheckout({ sessionId })
            return
          }
        }
      }

      // Demo mode — activate immediately
      await new Promise((r) => setTimeout(r, 800))
      updateProfile({ isPremium: true })
      closePaywall()
      toast.success(t('paywall.premiumActivated'))
    } catch (err) {
      toast.error(t('paywall.paymentFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async () => {
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      toast(t('paywall.noPurchaseFound'), { icon: '🔄' })
    } finally {
      setIsLoading(false)
    }
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
            className="max-w-[430px] mx-auto min-h-full flex flex-col px-6 pb-8 pt-4"
          >
            {/* Close */}
            <div className="flex justify-end mb-2">
              <button
                onClick={closePaywall}
                className="w-8 h-8 flex items-center justify-center text-[#888888] hover:text-[#F5F5F5] transition-colors"
                aria-label={t('paywall.close') as string}
              >
                <X size={20} />
              </button>
            </div>

            {/* Trial banner */}
            {trialActive && (
              <div className="mb-4 px-4 py-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center gap-2">
                <Zap size={14} className="text-yellow-500 flex-shrink-0" />
                <p className="text-yellow-400 text-xs font-semibold">
                  {t('paywall.trialLeft', { count: trialDaysLeft })}
                </p>
              </div>
            )}

            {/* Header */}
            <div className="mb-5 text-center">
              <Crown size={40} className="text-accent-red mx-auto mb-3" />
              <h1 className="font-heading font-extrabold text-[28px] leading-none tracking-tight text-[#F5F5F5] mb-2">
                {t('paywall.title')}
              </h1>
              <p className="text-[#888888] text-sm leading-relaxed">
                {translatedFeature
                  ? t('paywall.subtitleFeature', { feature: translatedFeature })
                  : t('paywall.subtitleDefault')}
              </p>
            </div>

            {/* Features */}
            <ul className="space-y-2.5 mb-6">
              {FEATURE_ICONS_KEYS.map((f) => (
                <li key={f.key} className="flex items-center gap-3">
                  <span className="text-base w-5 text-center flex-shrink-0">{f.icon}</span>
                  <span className="text-[#F5F5F5] text-sm">{t(f.key)}</span>
                  <Check size={14} className="text-green-500 flex-shrink-0 ml-auto" />
                </li>
              ))}
            </ul>

            {/* Plan selector */}
            <div className="flex gap-3 mb-5">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id as any)}
                  className={`flex-1 relative rounded-xl p-4 text-center border-2 transition-all ${
                    selectedPlan === plan.id
                      ? 'border-accent-red bg-accent-red/8'
                      : 'border-[#242424] bg-[#1C1C1C] hover:border-[#444444]'
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-red text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                      {plan.badge}
                    </span>
                  )}
                  <p className="text-[#888888] text-xs font-heading uppercase tracking-wider mb-1">{plan.label}</p>
                  <p className="font-mono font-bold text-[26px] text-[#F5F5F5] leading-none">{plan.price}</p>
                  <p className="text-[#444444] text-xs mt-1">{plan.period}</p>
                </button>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full bg-accent-red text-white font-heading font-bold text-base py-4 rounded-xl mb-3 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <RefreshCw size={18} />
                </motion.div>
              ) : (
                <>
                  <Crown size={18} />
                  {t('paywall.startPremium')}
                </>
              )}
            </button>

            <button
              onClick={handleRestore}
              disabled={isLoading}
              className="w-full text-[#888888] text-sm py-2 hover:text-[#F5F5F5] transition-colors"
            >
              {t('paywall.restorePurchase')}
            </button>

            {/* Trust signal */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <Shield size={12} className="text-[#444444]" />
              <p className="text-[#444444] text-xs">{t('paywall.cancelAnytime')}</p>
            </div>

            <button
              onClick={closePaywall}
              className="w-full text-[#444444] text-xs py-3 hover:text-[#888888] transition-colors mt-2"
            >
              {t('paywall.maybeLater')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
