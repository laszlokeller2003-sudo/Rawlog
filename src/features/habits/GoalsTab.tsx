import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react'
import { useGoalsStore } from '@/stores/useGoalsStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { useUIStore } from '@/stores/useUIStore'
import { GoalCard } from './GoalCard'
import { EmptyState } from '@/components/EmptyState'

interface GoalsTabProps {
  onAddGoal: () => void
}

export function GoalsTab({ onAddGoal }: GoalsTabProps) {
  const { getActiveGoals, getAchievedGoals, goals } = useGoalsStore()
  const { profile } = useProfileStore()
  const { openPaywall } = useUIStore()

  const [showAchieved, setShowAchieved] = useState(false)

  const activeGoals = getActiveGoals()
  const achievedGoals = getAchievedGoals()
  const isPremium = profile.isPremium

  const showPaywallBanner = goals.length >= 2 && !isPremium

  if (goals.length === 0) {
    return (
      <EmptyState
        message="No goals yet. Set your sights high."
        icon="🏆"
        action={{
          label: 'Create a Goal',
          onClick: onAddGoal,
        }}
      />
    )
  }

  return (
    <div className="flex-1 pb-20">
      {/* Premium Banner */}
      {showPaywallBanner && (
        <div
          onClick={() => openPaywall('unlimited_goals')}
          className="mb-4 p-4 rounded-lg bg-accent-red/10 border border-accent-red/20 text-center cursor-pointer transition-all hover:bg-accent-red/15"
        >
          <p className="text-sm font-semibold text-accent-red">Upgrade to Premium for Unlimited Goals</p>
          <p className="text-xs text-[#888888] mt-1">You have reached the free limit of 2 goals. Tap to unlock.</p>
        </div>
      )}

      {/* Active Goals */}
      <div className="space-y-1">
        {activeGoals.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>

      {/* Collapsible Achieved Section */}
      {achievedGoals.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowAchieved((v) => !v)}
            className="w-full flex items-center justify-between py-2 border-b border-border text-text-secondary hover:text-text-primary transition-colors text-xs font-heading font-semibold uppercase tracking-wider cursor-pointer"
          >
            <span className="flex items-center gap-1.5 text-yellow-500">
              <Trophy size={14} />
              Achieved ({achievedGoals.length})
            </span>
            {showAchieved ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <AnimatePresence>
            {showAchieved && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 space-y-1 overflow-hidden"
              >
                {achievedGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
