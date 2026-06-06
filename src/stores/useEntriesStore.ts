import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Entry, CategoryId } from '@/types'
import { generateId, toDateString } from '@/lib/utils'

interface EntriesState {
  entries: Entry[]
  addEntry: (entry: Omit<Entry, 'id' | 'synced'>) => Entry
  updateEntry: (id: string, updates: Partial<Entry>) => void
  deleteEntry: (id: string) => void
  getEntriesByDate: (date: string) => Entry[]
  getEntriesByCategory: (category: CategoryId) => Entry[]
  getEntriesInRange: (start: Date, end: Date) => Entry[]
  searchEntries: (query: string) => Entry[]
  getTodayEntries: () => Entry[]
  clearAll: () => void
}

export const useEntriesStore = create<EntriesState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entryData) => {
        const entry: Entry = {
          ...entryData,
          id: generateId(),
          synced: false,
        }
        set((state) => ({ entries: [entry, ...state.entries] }))
        return entry
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }))
      },

      deleteEntry: (id) => {
        set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }))
      },

      getEntriesByDate: (date) => {
        return get().entries.filter((e) => e.timestamp.startsWith(date))
      },

      getEntriesByCategory: (category) => {
        return get().entries.filter((e) => e.category === category)
      },

      getEntriesInRange: (start, end) => {
        const startStr = start.toISOString()
        const endStr = end.toISOString()
        return get().entries.filter((e) => e.timestamp >= startStr && e.timestamp <= endStr)
      },

      searchEntries: (query) => {
        const q = query.toLowerCase()
        return get().entries.filter(
          (e) =>
            e.subcategory.toLowerCase().includes(q) ||
            e.note?.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q) ||
            e.tags?.some((t) => t.toLowerCase().includes(q))
        )
      },

      getTodayEntries: () => {
        const today = toDateString()
        return get().entries.filter((e) => e.timestamp.startsWith(today))
      },

      clearAll: () => set({ entries: [] }),
    }),
    {
      name: 'rawlog-entries',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
