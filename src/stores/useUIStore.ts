import { create } from 'zustand'
import type { TabId, CategoryId, TimeFilter } from '@/types'

interface UIState {
  activeTab: TabId
  activeEntryCategory: CategoryId | null
  isEntrySheetOpen: boolean
  isPaywallOpen: boolean
  paywallFeature: string | null
  searchQuery: string
  statsTimeFilter: TimeFilter
  activeDashboard: 'finance' | 'body' | 'relationships' | 'productivity'
  insightsActiveTab: 'insights' | 'chat' | 'plan'
  habitsActiveTab: 'habits' | 'goals'
  setActiveTab: (tab: TabId) => void
  openEntrySheet: (category: CategoryId) => void
  closeEntrySheet: () => void
  openPaywall: (feature?: string) => void
  closePaywall: () => void
  setSearchQuery: (q: string) => void
  setStatsTimeFilter: (filter: TimeFilter) => void
  setActiveDashboard: (d: UIState['activeDashboard']) => void
  setInsightsActiveTab: (t: 'insights' | 'chat' | 'plan') => void
  setHabitsActiveTab: (t: UIState['habitsActiveTab']) => void
}

export const useUIStore = create<UIState>()((set) => ({
  activeTab: 'home',
  activeEntryCategory: null,
  isEntrySheetOpen: false,
  isPaywallOpen: false,
  paywallFeature: null,
  searchQuery: '',
  statsTimeFilter: 'week',
  activeDashboard: 'finance',
  insightsActiveTab: 'insights',
  habitsActiveTab: 'habits',

  setActiveTab: (tab) => set({ activeTab: tab }),
  openEntrySheet: (category) => set({ activeEntryCategory: category, isEntrySheetOpen: true }),
  closeEntrySheet: () => set({ isEntrySheetOpen: false, activeEntryCategory: null }),
  openPaywall: (feature) => set({ isPaywallOpen: true, paywallFeature: feature ?? null }),
  closePaywall: () => set({ isPaywallOpen: false, paywallFeature: null }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setStatsTimeFilter: (filter) => set({ statsTimeFilter: filter }),
  setActiveDashboard: (d) => set({ activeDashboard: d }),
  setInsightsActiveTab: (t) => set({ insightsActiveTab: t }),
  setHabitsActiveTab: (t) => set({ habitsActiveTab: t }),
}))
