import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { UserProfile, BodyMetric, EntryTemplate } from '@/types'
import { generateId } from '@/lib/utils'

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  language: 'en',
  currency: 'EUR',
  selectedCategories: ['substances', 'intimacy', 'fitness', 'sleep', 'mood', 'nutrition', 'finance', 'social', 'work', 'health'],
  goals: [],
  reminderFrequency: 'none',
  cloudSyncEnabled: false,
  appLockEnabled: false,
  isPremium: false,
  trialStartedAt: new Date().toISOString(),
  onboardingComplete: false,
  dailyReportEnabled: true,
  dailyReportTime: '21:00',
  weeklyReportEnabled: true,
  monthlyReportEnabled: true,
  scoreGoal: 75,
  fitnessIntensityGoal: 7,
  sleepQualityGoal: 8,
  workFocusGoal: 8,
  moodGoal: 7,
  calorieGoal: 2000,
  waterGoalMl: 2500,
  scoreWeights: {
    sleep: 25,
    fitness: 20,
    work: 20,
    finance: 15,
    social: 10,
    nutrition: 5,
    health: 5,
  },
}

interface ProfileState {
  profile: UserProfile
  bodyMetrics: BodyMetric[]
  templates: EntryTemplate[]
  authUserId: string | null
  updateProfile: (updates: Partial<UserProfile>) => void
  completeOnboarding: () => void
  addBodyMetric: (metric: Omit<BodyMetric, 'id'>) => void
  updateBodyMetric: (id: string, updates: Partial<BodyMetric>) => void
  addTemplate: (template: Omit<EntryTemplate, 'id'>) => void
  deleteTemplate: (id: string) => void
  setAuthUser: (userId: string | null) => void
  clearAll: () => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      bodyMetrics: [],
      templates: [],
      authUserId: null,

      updateProfile: (updates) => {
        set((state) => ({ profile: { ...state.profile, ...updates } }))
      },

      completeOnboarding: () => {
        set((state) => ({
          profile: { ...state.profile, onboardingComplete: true },
        }))
      },

      addBodyMetric: (metricData) => {
        const metric: BodyMetric = { ...metricData, id: generateId() }
        set((state) => ({ bodyMetrics: [metric, ...state.bodyMetrics] }))
      },

      updateBodyMetric: (id, updates) => {
        set((state) => ({
          bodyMetrics: state.bodyMetrics.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }))
      },

      addTemplate: (templateData) => {
        const template: EntryTemplate = { ...templateData, id: generateId() }
        set((state) => ({ templates: [...state.templates, template] }))
      },

      deleteTemplate: (id) => {
        set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }))
      },

      setAuthUser: (userId) => set({ authUserId: userId }),

      clearAll: () =>
        set({
          profile: DEFAULT_PROFILE,
          bodyMetrics: [],
          templates: [],
          authUserId: null,
        }),
    }),
    {
      name: 'lyfe-profile',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
