import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useHabitsStore } from '@/stores/useHabitsStore'
import { getCategoryById } from '@/lib/categories'
import { toDateString } from '@/lib/utils'
import { hapticSuccess, hapticTap } from '@/lib/haptics'
import type { Habit } from '@/types'

interface HabitCardProps {
  habit: Habit
}

function generateLast90Days(): string[] {
  const days: string[] = []
  const today = new Date()
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    days.push(toDateString(d))
  }
  return days
}

export function HabitCard({ habit }: HabitCardProps) {
  const { t } = useTranslation()
  const { checkInHabit, uncheckinHabit, isCompleted, deleteHabit, getCompletedDates } = useHabitsStore()
  const category = getCategoryById(habit.category)
  const completedDates = getCompletedDates(habit.id)
  const todayDone = isCompleted(habit.id)
  const today = toDateString()

  const last90 = useMemo(() => generateLast90Days(), [])

  // Calculate this week completion %
  const weekCompletionPct = useMemo(() => {
    const weekDays: string[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      weekDays.push(toDateString(d))
    }
    const done = weekDays.filter((d) => completedDates.includes(d)).length
    return Math.round((done / 7) * 100)
  }, [completedDates])

  const handleToggle = () => {
    if (todayDone) {
      uncheckinHabit(habit.id, today)
      hapticTap()
    } else {
      checkInHabit(habit.id, today)
      hapticSuccess()
      toast.success(t('habits.habitCheckedInToast'), { id: habit.id })
    }
  }

  const handleDelete = () => {
    if (window.confirm(t('habits.deleteHabitConfirm', { name: habit.name }))) {
      deleteHabit(habit.id)
      toast.success(t('habits.habitDeletedToast'))
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-bg-card border border-border rounded-lg p-4 mb-3 relative"
    >
      {/* Delete button */}
      <button
        className="absolute top-3 right-3 text-text-muted hover:text-text-primary transition-colors p-1"
        onClick={handleDelete}
        aria-label={t('habits.deleteHabitAria')}
      >
        <X size={14} />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pr-6">
        <span className="text-lg">{category.icon}</span>
        <h3 className="font-heading font-bold text-text-primary text-[15px] truncate flex-1">
          {habit.name}
        </h3>
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: category.color }}
        />
      </div>

      {/* Streak row */}
      <div className="flex items-center gap-3 mb-3">
        <span className="streak-pill">{t('habits.streakDays', { count: habit.currentStreak })}</span>
        <span className="text-text-muted text-xs">
          {t('habits.longestStreak', { count: habit.longestStreak })}
        </span>
      </div>

      {/* 90-day heatmap */}
      <div
        className="grid gap-px mb-3"
        style={{
          gridTemplateColumns: 'repeat(13, 8px)',
          gridTemplateRows: 'repeat(7, 8px)',
          gridAutoFlow: 'column',
        }}
      >
        {last90.map((date) => (
          <div
            key={date}
            className="heatmap-cell"
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: completedDates.includes(date) ? '#FF2020' : '#1A1A1A',
            }}
            title={date}
          />
        ))}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleToggle}
          className={`px-4 py-1.5 text-sm font-heading font-semibold rounded-md border transition-all duration-150 ${
            todayDone
              ? 'border-green-500/40 text-green-400 bg-green-500/10'
              : 'border-accent-red bg-accent-red text-white'
          }`}
        >
          {todayDone ? t('habits.doneCheck') : t('habits.markDone')}
        </motion.button>

        <span className="text-xs text-text-muted font-mono">
          {t('habits.weekPercent', { percent: weekCompletionPct })}
        </span>
      </div>
    </motion.div>
  )
}
