import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Trash2, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useGoalsStore } from '@/stores/useGoalsStore'
import { getCategoryById } from '@/lib/categories'
import { hapticSuccess, hapticTap } from '@/lib/haptics'
import type { Goal } from '@/types'

interface GoalCardProps {
  goal: Goal
}

export function GoalCard({ goal }: GoalCardProps) {
  const { t } = useTranslation()
  const { updateProgress, deleteGoal } = useGoalsStore()
  const category = getCategoryById(goal.category)
  
  const [isEditing, setIsEditing] = useState(false)
  const [manualValue, setManualValue] = useState(String(goal.currentValue))

  const percent = goal.targetValue > 0 
    ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
    : 0

  const handleIncrement = () => {
    hapticTap()
    const newValue = goal.currentValue + 1
    updateProgress(goal.id, newValue)
    setManualValue(String(newValue))
    if (newValue === goal.targetValue) {
      hapticSuccess()
      toast.success(t('habits.goalAchievedToast', { title: goal.title }))
    }
  }

  const handleDecrement = () => {
    hapticTap()
    const newValue = Math.max(0, goal.currentValue - 1)
    updateProgress(goal.id, newValue)
    setManualValue(String(newValue))
  }

  const handleManualSave = () => {
    const val = parseFloat(manualValue)
    if (isNaN(val) || val < 0) return
    updateProgress(goal.id, val)
    setIsEditing(false)
    if (val >= goal.targetValue && !goal.achieved) {
      hapticSuccess()
      toast.success(t('habits.goalAchievedToast', { title: goal.title }))
    }
  }

  const handleDelete = () => {
    if (window.confirm(t('habits.deleteGoalConfirm', { title: goal.title }))) {
      deleteGoal(goal.id)
      toast.success(t('habits.goalDeletedToast'))
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`bg-bg-card border rounded-lg p-4 mb-3 relative overflow-hidden transition-all duration-300 ${
        goal.achieved ? 'border-yellow-500/40 shadow-yellow-500/5' : 'border-border'
      }`}
    >
      {/* Top Background Glow for Achieved */}
      {goal.achieved && (
        <div className="absolute top-0 left-0 w-full h-[3px] bg-yellow-500" />
      )}

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-3 right-3 text-text-muted hover:text-text-primary transition-colors p-1"
        aria-label={t('habits.deleteGoalAria')}
      >
        <Trash2 size={14} />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pr-6">
        <span className="text-xl">{category.icon}</span>
        <h3 className="font-heading font-bold text-text-primary text-[15px] truncate flex-1">
          {goal.title}
        </h3>
        {goal.achieved ? (
          <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-500 uppercase tracking-wide bg-yellow-500/10 px-2 py-0.5 rounded-full">
            <Trophy size={10} />
            {t('habits.achieved')}
          </span>
        ) : (
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: category.color }}
          />
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs font-mono text-text-secondary mb-1.5">
          <span>
            {goal.currentValue} / {goal.targetValue} {goal.unit}
          </span>
          <span style={{ color: goal.achieved ? '#EAB308' : '#FF2020' }}>{percent}%</span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${goal.achieved ? 'bg-yellow-500' : 'bg-accent-red'}`}
          />
        </div>
      </div>

      {/* Deadline if set */}
      {goal.deadline && (
        <div className="text-[11px] text-text-muted mb-4 font-mono">
          {t('habits.deadline', { date: new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) })}
        </div>
      )}

      {/* Quick updates controls */}
      {!goal.achieved && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDecrement}
              className="w-7 h-7 rounded border border-border flex items-center justify-center bg-bg-surface text-text-secondary hover:text-text-primary"
            >
              <Minus size={14} />
            </button>
            <button
              onClick={handleIncrement}
              className="w-7 h-7 rounded border border-border flex items-center justify-center bg-bg-surface text-text-secondary hover:text-text-primary"
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex-1 flex gap-1.5 items-center justify-end">
            {isEditing ? (
              <>
                <input
                  type="number"
                  value={manualValue}
                  onChange={(e) => setManualValue(e.target.value)}
                  className="w-16 rounded border border-border bg-bg-surface px-2 py-1 font-mono text-xs text-right outline-none"
                  style={{ colorScheme: 'dark' }}
                />
                <button
                  onClick={handleManualSave}
                  className="px-2.5 py-1 rounded bg-accent-red text-white font-heading text-xs font-bold"
                >
                  {t('habits.ok')}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-text-muted hover:text-text-primary underline font-mono"
              >
                {t('habits.setValue')}
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}
