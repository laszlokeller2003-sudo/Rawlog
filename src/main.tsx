import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/index.ts'
import { initAuthListener, scheduleSyncPush } from './lib/sync'
import { useEntriesStore } from './stores/useEntriesStore'
import { useHabitsStore } from './stores/useHabitsStore'
import { useGoalsStore } from './stores/useGoalsStore'

// Initialize Supabase auth state listener
initAuthListener()

// Sync to Supabase whenever local data changes (debounced 3s in scheduleSyncPush)
useEntriesStore.subscribe((state, prev) => {
  if (state.entries !== prev.entries) scheduleSyncPush()
})
useHabitsStore.subscribe((state, prev) => {
  if (state.habits !== prev.habits || state.habitLogs !== prev.habitLogs) scheduleSyncPush()
})
useGoalsStore.subscribe((state, prev) => {
  if (state.goals !== prev.goals) scheduleSyncPush()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
