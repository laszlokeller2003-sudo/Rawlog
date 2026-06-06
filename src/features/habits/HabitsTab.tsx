import React from 'react'
import { useHabitsStore } from '@/stores/useHabitsStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { useUIStore } from '@/stores/useUIStore'
import { HabitCard } from './HabitCard'
import { EmptyState } from '@/components/EmptyState'

interface HabitsTabProps {
  onAddHabit: () => void
}

export function HabitsTab({ onAddHabit }: HabitsTabProps) {
  const { habits } = useHabitsStore()
  const { profile } = useProfileStore()
  const { openPaywall } = useUIStore()
  const isPremium = profile.isPremium

  const showPaywallBanner = habits.length >= 3 && !isPremium

  return (
    <div className="flex-1 pb-20">
      {showPaywallBanner && (
        <div
          onClick={() => openPaywall('unlimited_habits')}
          className="mb-4 p-4 rounded-lg bg-accent-red/10 border border-accent-red/20 text-center cursor-pointer transition-all hover:bg-accent-red/15"
        >
          <p className="text-sm font-semibold text-accent-red">Upgrade to Premium for Unlimited Habits</p>
          <p className="text-xs text-[#888888] mt-1">You have reached the free limit of 3 habits. Tap to unlock.</p>
        </div>
      )}

      {habits.length === 0 ? (
        <EmptyState
          message="No habits yet. Build the life you want."
          icon="🎯"
          action={{
            label: 'Create a Habit',
            onClick: onAddHabit,
          }}
        />
      ) : (
        <div className="space-y-1">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </div>
      )}
    </div>
  )
}
