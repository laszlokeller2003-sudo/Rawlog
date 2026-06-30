import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/index.ts'
import { initAuthListener, scheduleSyncPush } from './lib/sync'
import { useEntriesStore } from './stores/useEntriesStore'
import { useHabitsStore } from './stores/useHabitsStore'
import { useGoalsStore } from './stores/useGoalsStore'
import { useScoreStore } from './stores/useScoreStore'

// Initialize Supabase auth state listener
initAuthListener()

// Auto-save daily score (debounced 5s) and push to Supabase on any data change
let scoreSaveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleScoreSave() {
  if (scoreSaveTimer) clearTimeout(scoreSaveTimer)
  scoreSaveTimer = setTimeout(() => {
    const today = new Date().toISOString().split('T')[0]
    useScoreStore.getState().saveDailyScore(today)
  }, 5000)
}

useEntriesStore.subscribe((state, prev) => {
  if (state.entries !== prev.entries) {
    scheduleSyncPush()
    scheduleScoreSave()
  }
})
useHabitsStore.subscribe((state, prev) => {
  if (state.habits !== prev.habits || state.habitLogs !== prev.habitLogs) scheduleSyncPush()
})
useGoalsStore.subscribe((state, prev) => {
  if (state.goals !== prev.goals) {
    scheduleSyncPush()
    scheduleScoreSave()
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
