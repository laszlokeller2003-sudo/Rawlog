import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock } from 'lucide-react'
import { useUIStore } from '@/stores/useUIStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { FinanceDashboard } from './FinanceDashboard'
import { BodyHealthDashboard } from './BodyHealthDashboard'
import { RelationshipsDashboard } from './RelationshipsDashboard'
import { ProductivityDashboard } from './ProductivityDashboard'

export function DashboardsScreen() {
  const { activeDashboard, setActiveDashboard, openPaywall } = useUIStore()
  const { profile } = useProfileStore()
  const isPremium = profile.isPremium

  const tabs = [
    { id: 'finance' as const, label: 'Finance', emoji: '💰', premium: false },
    { id: 'body' as const, label: 'Body', emoji: '💪', premium: true },
    { id: 'relationships' as const, label: 'Relations', emoji: '👥', premium: true },
    { id: 'productivity' as const, label: 'Work', emoji: '⚡', premium: true },
  ]

  const activeTab = tabs.find((t) => t.id === activeDashboard) || tabs[0]

  return (
    <div className="flex flex-col min-h-full bg-bg-base text-text-primary pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-bg-base pt-6 px-4 pb-2 border-b border-border">
        <h2 className="font-heading font-bold text-2xl mb-4">Dashboards</h2>
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {tabs.map((tab) => {
            const isActive = activeDashboard === tab.id
            const showLock = tab.premium && !isPremium

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveDashboard(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-heading text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? 'bg-accent-red border-accent-red text-white'
                    : 'bg-bg-surface border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
                {showLock && <Lock size={12} className="ml-1 text-accent-red" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-4 pt-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab.premium && !isPremium ? (
            <motion.div
              key="paywall-gate"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center py-16 px-6 text-center card bg-bg-surface border border-border rounded-lg mt-4"
            >
              <div className="w-16 h-16 rounded-full bg-accent-red/10 border border-accent-red/20 flex items-center justify-center mb-4">
                <Lock size={28} className="text-accent-red" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-2">
                Unlock {activeTab.label} Dashboard
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6 max-w-xs">
                Visualize trends, correlation scores, and history of your {activeTab.label.toLowerCase()} entries with LYFE Premium.
              </p>
              <button
                type="button"
                onClick={() => openPaywall(activeTab.id)}
                className="btn-primary w-full"
              >
                Upgrade to Premium
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={activeDashboard}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeDashboard === 'finance' && <FinanceDashboard />}
              {activeDashboard === 'body' && <BodyHealthDashboard />}
              {activeDashboard === 'relationships' && <RelationshipsDashboard />}
              {activeDashboard === 'productivity' && <ProductivityDashboard />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
