import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Habit, HabitLog, CategoryId, HabitFrequency } from '@/types'
import { generateId, toDateString } from '@/lib/utils'

interface HabitsState {
  habits: Habit[]
  habitLogs: HabitLog[]
  addHabit: (habit: Omit<Habit, 'id' | 'currentStreak' | 'longestStreak' | 'createdAt'>) => Habit
  updateHabit: (id: string, updates: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  checkInHabit: (habitId: string, date?: string) => void
  uncheckinHabit: (habitId: string, date?: string) => void
  isCompleted: (habitId: string, date?: string) => boolean
  getStreak: (habitId: string) => number
  recalculateStreaks: () => void
  getCompletedDates: (habitId: string) => string[]
  clearAll: () => void
}

function recalcStreak(logs: HabitLog[], habitId: string, frequency: HabitFrequency): { current: number; longest: number } {
  const completedDates = logs
    .filter((l) => l.habitId === habitId && l.completed)
    .map((l) => l.date)
    .sort((a, b) => b.localeCompare(a))

  if (completedDates.length === 0) return { current: 0, longest: 0 }

  let current = 0
  let longest = 0
  let streak = 0
  const today = toDateString()

  // Simple daily streak calculation
  let checkDate = today
  for (let i = 0; i < 365; i++) {
    if (completedDates.includes(checkDate)) {
      streak++
      if (i < 2) current = streak // Only count recent streak
    } else {
      if (streak > longest) longest = streak
      streak = 0
      if (i > 1) break // Stop if gap in non-recent history
    }
    // Go back one day
    const d = new Date(checkDate)
    d.setDate(d.getDate() - 1)
    checkDate = toDateString(d)
  }
  if (streak > longest) longest = streak
  current = streak

  return { current, longest }
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      habitLogs: [],

      addHabit: (habitData) => {
        const habit: Habit = {
          ...habitData,
          id: generateId(),
          currentStreak: 0,
          longestStreak: 0,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ habits: [...state.habits, habit] }))
        return habit
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        }))
      },

      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          habitLogs: state.habitLogs.filter((l) => l.habitId !== id),
        }))
      },

      checkInHabit: (habitId, date = toDateString()) => {
        const { habitLogs } = get()
        const existing = habitLogs.find((l) => l.habitId === habitId && l.date === date)
        if (existing) {
          set((state) => ({
            habitLogs: state.habitLogs.map((l) =>
              l.id === existing.id ? { ...l, completed: true } : l
            ),
          }))
        } else {
          const log: HabitLog = { id: generateId(), habitId, date, completed: true }
          set((state) => ({ habitLogs: [...state.habitLogs, log] }))
        }
        // Recalculate streak for this habit
        const habit = get().habits.find((h) => h.id === habitId)
        if (habit) {
          const { current, longest } = recalcStreak(get().habitLogs, habitId, habit.frequency)
          set((state) => ({
            habits: state.habits.map((h) =>
              h.id === habitId
                ? { ...h, currentStreak: current, longestStreak: Math.max(longest, h.longestStreak) }
                : h
            ),
          }))
        }
      },

      uncheckinHabit: (habitId, date = toDateString()) => {
        set((state) => ({
          habitLogs: state.habitLogs.map((l) =>
            l.habitId === habitId && l.date === date ? { ...l, completed: false } : l
          ),
        }))
        const habit = get().habits.find((h) => h.id === habitId)
        if (habit) {
          const { current, longest } = recalcStreak(get().habitLogs, habitId, habit.frequency)
          set((state) => ({
            habits: state.habits.map((h) =>
              h.id === habitId ? { ...h, currentStreak: current } : h
            ),
          }))
        }
      },

      isCompleted: (habitId, date = toDateString()) => {
        return get().habitLogs.some((l) => l.habitId === habitId && l.date === date && l.completed)
      },

      getStreak: (habitId) => {
        return get().habits.find((h) => h.id === habitId)?.currentStreak ?? 0
      },

      recalculateStreaks: () => {
        const { habits, habitLogs } = get()
        const updated = habits.map((h) => {
          const { current, longest } = recalcStreak(habitLogs, h.id, h.frequency)
          return { ...h, currentStreak: current, longestStreak: Math.max(longest, h.longestStreak) }
        })
        set({ habits: updated })
      },

      getCompletedDates: (habitId) => {
        return get()
          .habitLogs.filter((l) => l.habitId === habitId && l.completed)
          .map((l) => l.date)
      },

      clearAll: () => set({ habits: [], habitLogs: [] }),
    }),
    {
      name: 'lyfe-habits',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
