import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ChatMessage, Insight } from '@/types'
import { generateId } from '@/lib/utils'

interface ChatState {
  messages: ChatMessage[]
  insights: Insight[]
  lastInsightAt: string | null
  isGeneratingInsights: boolean
  pendingQuestion: string | null
  addMessage: (role: ChatMessage['role'], content: string) => ChatMessage
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void
  appendToMessage: (id: string, chunk: string) => void
  clearMessages: () => void
  setInsights: (insights: Insight[]) => void
  setGeneratingInsights: (val: boolean) => void
  setPendingQuestion: (q: string | null) => void
  clearAll: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      insights: [],
      lastInsightAt: null,
      isGeneratingInsights: false,
      pendingQuestion: null,

      addMessage: (role, content) => {
        const msg: ChatMessage = {
          id: generateId(),
          role,
          content,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ messages: [...state.messages, msg] }))
        return msg
      },

      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }))
      },

      appendToMessage: (id, chunk) => {
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, content: m.content + chunk } : m
          ),
        }))
      },

      clearMessages: () => set({ messages: [] }),

      setInsights: (insights) => {
        set({ insights, lastInsightAt: new Date().toISOString() })
      },

      setGeneratingInsights: (val) => set({ isGeneratingInsights: val }),

      setPendingQuestion: (q) => set({ pendingQuestion: q }),

      clearAll: () => set({ messages: [], insights: [], lastInsightAt: null, pendingQuestion: null }),
    }),
    {
      name: 'lyfe-chat',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
