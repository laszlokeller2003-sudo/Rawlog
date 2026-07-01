import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useUIStore } from '@/stores/useUIStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { useHabitsStore } from '@/stores/useHabitsStore'
import { useGoalsStore } from '@/stores/useGoalsStore'
import { HabitsTab } from './HabitsTab'
import { GoalsTab } from './GoalsTab'
import { CreateHabitModal } from './CreateHabitModal'
import { CreateGoalModal } from './CreateGoalModal'

export function HabitsScreen() {
  const { t } = useTranslation()
  const { habitsActiveTab, setHabitsActiveTab, openPaywall } = useUIStore()
  const { profile } = useProfileStore()
  const { habits } = useHabitsStore()
  const { goals } = useGoalsStore()

  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)

  const isPremium = profile.isPremium

  const handlePlusClick = () => {
    if (habitsActiveTab === 'habits') {
      if (habits.length >= 3 && !isPremium) {
        openPaywall('unlimited_habits')
      } else {
        setIsHabitModalOpen(true)
      }
    } else {
      if (goals.length >= 2 && !isPremium) {
        openPaywall('unlimited_goals')
      } else {
        setIsGoalModalOpen(true)
      }
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-bg-base text-text-primary pb-24 relative">
      {/* Header with sticky tabs */}
      <div className="sticky top-0 z-20 bg-bg-base pt-6 px-4 pb-2 border-b border-border">
        <h2 className="font-heading font-bold text-2xl mb-4">{t('habits.title')}</h2>

        {/* Tabs Bar */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setHabitsActiveTab('habits')}
            className={`flex-1 py-2 text-center text-xs font-heading font-semibold uppercase tracking-wider transition-all cursor-pointer border rounded-md ${
              habitsActiveTab === 'habits'
                ? 'bg-accent-red border-accent-red text-white'
                : 'bg-bg-surface border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('habits.tabHabits')}
          </button>
          <button
            type="button"
            onClick={() => setHabitsActiveTab('goals')}
            className={`flex-1 py-2 text-center text-xs font-heading font-semibold uppercase tracking-wider transition-all cursor-pointer border rounded-md ${
              habitsActiveTab === 'goals'
                ? 'bg-accent-red border-accent-red text-white'
                : 'bg-bg-surface border-border text-text-secondary hover:text-text-primary'
            }`}
          >
            {t('habits.tabGoals')}
          </button>
        </div>
      </div>

      {/* Content wrapper */}
      <div className="flex-1 px-4 pt-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={habitsActiveTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {habitsActiveTab === 'habits' ? (
              <HabitsTab onAddHabit={() => setIsHabitModalOpen(true)} />
            ) : (
              <GoalsTab onAddGoal={() => setIsGoalModalOpen(true)} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Action Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handlePlusClick}
        className="fixed bottom-24 right-4 w-12 h-12 rounded-full bg-accent-red flex items-center justify-center text-white shadow-lg cursor-pointer z-30"
        aria-label={habitsActiveTab === 'habits' ? t('habits.addNewHabitAria') : t('habits.addNewGoalAria')}
      >
        <Plus size={24} />
      </motion.button>

      {/* Creation Modals */}
      <CreateHabitModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
      />
      <CreateGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
      />
    </div>
  )
}
