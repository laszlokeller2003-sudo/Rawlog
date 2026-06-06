import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Goal, CategoryId } from '@/types'
import { generateId } from '@/lib/utils'

interface GoalsState {
  goals: Goal[]
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'achieved' | 'achievedAt'>) => Goal
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void
  updateProgress: (id: string, currentValue: number) => void
  markAchieved: (id: string) => void
  getActiveGoals: () => Goal[]
  getAchievedGoals: () => Goal[]
  clearAll: () => void
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goalData) => {
        const goal: Goal = {
          ...goalData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          achieved: false,
        }
        set((state) => ({ goals: [...state.goals, goal] }))
        return goal
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }))
      },

      deleteGoal: (id) => {
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }))
      },

      updateProgress: (id, currentValue) => {
        const goal = get().goals.find((g) => g.id === id)
        if (!goal) return
        const achieved = currentValue >= goal.targetValue
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id
              ? {
                  ...g,
                  currentValue,
                  achieved,
                  achievedAt: achieved && !g.achieved ? new Date().toISOString() : g.achievedAt,
                }
              : g
          ),
        }))
      },

      markAchieved: (id) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, achieved: true, achievedAt: new Date().toISOString() } : g
          ),
        }))
      },

      getActiveGoals: () => get().goals.filter((g) => !g.achieved),
      getAchievedGoals: () => get().goals.filter((g) => g.achieved),

      clearAll: () => set({ goals: [] }),
    }),
    {
      name: 'rawlog-goals',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
