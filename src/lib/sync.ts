/**
 * RAWLOG Sync Service
 * Local-first: all data is stored in Zustand (localStorage).
 * When user is authenticated, changes are synced to Supabase.
 */

import { supabase } from './supabase'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { useHabitsStore } from '@/stores/useHabitsStore'
import { useGoalsStore } from '@/stores/useGoalsStore'
import { useProfileStore } from '@/stores/useProfileStore'
import type { Entry } from '@/types'

let syncInProgress = false

// ─── Auth listener ────────────────────────────────────────────────────────────

export function initAuthListener() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    const { setAuthUser } = useProfileStore.getState()

    if (session?.user) {
      setAuthUser(session.user.id)
      if (event === 'SIGNED_IN') {
        // Pull remote data on sign in
        await pullFromSupabase(session.user.id)
      }
    } else {
      setAuthUser(null)
    }
  })
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export async function signUpWithEmail(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  })
  if (error) throw error
  return data
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// ─── Magic Link ───────────────────────────────────────────────────────────────

export async function signInWithMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ─── Get current session ──────────────────────────────────────────────────────

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session
}

// ─── Push local data to Supabase ─────────────────────────────────────────────

export async function pushToSupabase(userId: string) {
  if (syncInProgress) return
  syncInProgress = true

  try {
    const { entries } = useEntriesStore.getState()
    const { habits, habitLogs } = useHabitsStore.getState()
    const { goals } = useGoalsStore.getState()
    const { profile } = useProfileStore.getState()

    // Push profile
    await (supabase as any).from('users').upsert({
      id: userId,
      email: (await supabase.auth.getUser()).data.user?.email ?? '',
      name: profile.name,
      dob: profile.dateOfBirth ?? null,
      sex: profile.biologicalSex ?? null,
      language: profile.language,
      currency: profile.currency,
      photo_url: profile.photoUrl ?? null,
      score_weights: profile.scoreWeights,
      reminder_frequency: profile.reminderFrequency,
      reminder_time: profile.reminderTime ?? null,
      daily_report_enabled: profile.dailyReportEnabled,
      daily_report_time: profile.dailyReportTime,
      weekly_report_enabled: profile.weeklyReportEnabled,
      monthly_report_enabled: profile.monthlyReportEnabled,
      is_premium: profile.isPremium,
      onboarding_complete: profile.onboardingComplete,
      selected_categories: profile.selectedCategories,
      app_lock_enabled: profile.appLockEnabled,
    })

    // Push entries (upsert)
    if (entries.length > 0) {
      const rows = entries.map((e) => ({
        id: e.id,
        user_id: userId,
        category: e.category,
        subcategory: e.subcategory,
        fields: e.fields,
        note: e.note ?? null,
        tags: e.tags ?? null,
        timestamp: e.timestamp,
      }))

      // Push in batches of 100
      for (let i = 0; i < rows.length; i += 100) {
        await (supabase as any).from('entries').upsert(rows.slice(i, i + 100))
      }
    }

    // Push habits
    if (habits.length > 0) {
      const habitRows = habits.map((h) => ({
        id: h.id,
        user_id: userId,
        name: h.name,
        category: h.category,
        frequency: typeof h.frequency === 'string' ? h.frequency : JSON.stringify(h.frequency),
        current_streak: h.currentStreak,
        longest_streak: h.longestStreak,
        graceperiod: h.graceperiod,
        enabled: h.enabled,
        color: h.color ?? null,
      }))
      await (supabase as any).from('habits').upsert(habitRows)
    }

    // Push habit logs
    if (habitLogs.length > 0) {
      const logRows = habitLogs.map((l) => ({
        id: l.id,
        habit_id: l.habitId,
        user_id: userId,
        date: l.date,
        completed: l.completed,
      }))
      for (let i = 0; i < logRows.length; i += 100) {
        await (supabase as any).from('habit_logs').upsert(logRows.slice(i, i + 100), { onConflict: 'habit_id,date' })
      }
    }

    // Push goals
    if (goals.length > 0) {
      const goalRows = goals.map((g) => ({
        id: g.id,
        user_id: userId,
        title: g.title,
        category: g.category,
        target_value: g.targetValue,
        current_value: g.currentValue,
        unit: g.unit,
        deadline: g.deadline ?? null,
        achieved: g.achieved,
        achieved_at: g.achievedAt ?? null,
      }))
      await (supabase as any).from('goals').upsert(goalRows)
    }

    
  } catch (err) {
    console.error('[Sync] Push error:', err)
  } finally {
    syncInProgress = false
  }
}

// ─── Pull remote data to local ────────────────────────────────────────────────

export async function pullFromSupabase(userId: string) {
  try {
    const { updateProfile } = useProfileStore.getState()
    const { addEntry, entries: localEntries } = useEntriesStore.getState()

    // Pull profile
    const { data: profileData } = await (supabase as any)
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileData) {
      updateProfile({
        name: profileData.name,
        dateOfBirth: profileData.dob,
        biologicalSex: profileData.sex,
        language: profileData.language,
        currency: profileData.currency,
        photoUrl: profileData.photo_url,
        scoreWeights: profileData.score_weights,
        reminderFrequency: profileData.reminder_frequency,
        reminderTime: profileData.reminder_time,
        dailyReportEnabled: profileData.daily_report_enabled,
        dailyReportTime: profileData.daily_report_time,
        weeklyReportEnabled: profileData.weekly_report_enabled,
        monthlyReportEnabled: profileData.monthly_report_enabled,
        isPremium: profileData.is_premium,
        selectedCategories: profileData.selected_categories,
        appLockEnabled: profileData.app_lock_enabled,
      })
    }

    // Pull entries newer than newest local entry
    const latestLocal = localEntries[0]?.timestamp
    let query = (supabase as any)
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(500)

    if (latestLocal) {
      query = query.gt('timestamp', latestLocal)
    }

    const { data: remoteEntries } = await query
    if (remoteEntries && remoteEntries.length > 0) {
      const localIds = new Set(localEntries.map((e) => e.id))
      for (const re of remoteEntries) {
        if (!localIds.has(re.id)) {
          const entry: Entry = {
            id: re.id,
            category: re.category,
            subcategory: re.subcategory,
            fields: re.fields,
            note: re.note,
            tags: re.tags,
            timestamp: re.timestamp,
            synced: true,
          }
          // Insert to beginning of local store without triggering network push
          useEntriesStore.setState((state) => ({
            entries: [...state.entries, entry].sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ),
          }))
        }
      }
    }

    
  } catch (err) {
    console.error('[Sync] Pull error:', err)
  }
}

// ─── Auto-sync on entry changes ──────────────────────────────────────────────

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null

export function scheduleSyncPush() {
  const { authUserId } = useProfileStore.getState()
  if (!authUserId) return

  if (syncDebounceTimer) clearTimeout(syncDebounceTimer)
  syncDebounceTimer = setTimeout(() => {
    pushToSupabase(authUserId)
  }, 3000) // 3s debounce
}
