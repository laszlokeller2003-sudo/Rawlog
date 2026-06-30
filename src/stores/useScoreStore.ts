import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useEntriesStore } from './useEntriesStore'
import { useGoalsStore } from './useGoalsStore'
import { useProfileStore } from './useProfileStore'
import type { CategoryId, Entry, Goal } from '@/types'
import { supabase } from '@/lib/supabase'

export interface CategoryScoreDetail {
  score: number | null
  lastScore: number
  status: 'normal' | 'carry_90' | 'carry_75' | 'grayed_out'
}

export interface ScoreHistoryItem {
  id: string
  user_id: string
  date: string
  overall_score: number | null
  category_scores: Record<string, number | null>
}

interface ScoreState {
  history: ScoreHistoryItem[]
  calculateAllScoresForDate: (dateStr: string) => {
    overall: number | null
    categories: Record<CategoryId, CategoryScoreDetail>
    isFrozen: boolean
    frozenDate?: string
  }
  saveDailyScore: (dateStr: string) => Promise<void>
  loadHistory: () => Promise<void>
  clearAll: () => void
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────

function getDateBoundaries(dateStr: string) {
  const target = new Date(dateStr)
  const day = target.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day

  const monday = new Date(target)
  monday.setDate(target.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  const lastMonday = new Date(monday)
  lastMonday.setDate(monday.getDate() - 7)
  const lastSunday = new Date(lastMonday)
  lastSunday.setDate(lastMonday.getDate() + 6)
  lastSunday.setHours(23, 59, 59, 999)

  const firstOfMonth = new Date(target.getFullYear(), target.getMonth(), 1)
  const lastOfMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0, 23, 59, 59, 999)
  const firstOfLastMonth = new Date(target.getFullYear(), target.getMonth() - 1, 1)
  const lastOfLastMonth = new Date(target.getFullYear(), target.getMonth(), 0, 23, 59, 59, 999)

  return {
    monday: monday.toISOString().split('T')[0],
    sunday: sunday.toISOString().split('T')[0],
    lastMonday: lastMonday.toISOString().split('T')[0],
    lastSunday: lastSunday.toISOString().split('T')[0],
    firstOfMonth: firstOfMonth.toISOString().split('T')[0],
    lastOfMonth: lastOfMonth.toISOString().split('T')[0],
    firstOfLastMonth: firstOfLastMonth.toISOString().split('T')[0],
    lastOfLastMonth: lastOfLastMonth.toISOString().split('T')[0],
  }
}

function getDaysBetween(d1: string, d2: string): number {
  return Math.floor((new Date(d1).getTime() - new Date(d2).getTime()) / (1000 * 60 * 60 * 24))
}

function weekEntries(entries: Entry[], category: CategoryId, dateStr: string) {
  const b = getDateBoundaries(dateStr)
  return entries.filter(
    (e) => e.category === category && e.timestamp.split('T')[0] >= b.monday && e.timestamp.split('T')[0] <= dateStr
  )
}

function lastWeekEntries(entries: Entry[], category: CategoryId, dateStr: string) {
  const b = getDateBoundaries(dateStr)
  return entries.filter(
    (e) => e.category === category && e.timestamp.split('T')[0] >= b.lastMonday && e.timestamp.split('T')[0] <= b.lastSunday
  )
}

function avg(values: number[]): number {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
}

// ─── Category Score Formulas ──────────────────────────────────────────────────

function calculateFitnessScore(dateStr: string, entries: Entry[], goals: Goal[]): number {
  const week = weekEntries(entries, 'fitness', dateStr)
  const lastWeek = lastWeekEntries(entries, 'fitness', dateStr)

  const target = goals.find((g) => g.category === 'fitness' && !g.achieved)?.targetValue ?? 3
  const f1 = Math.min(1, week.length / target) * 40

  const intensities = week.map((e) => (e.fields as any).intensity).filter((v) => typeof v === 'number')
  const f2 = (avg(intensities) / 10) * 25

  let streak = 0
  const checkDate = new Date(dateStr)
  for (let i = 0; i < 7; i++) {
    const ds = checkDate.toISOString().split('T')[0]
    if (entries.some((e) => e.category === 'fitness' && e.timestamp.startsWith(ds))) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else break
  }
  const f3 = Math.min(1, streak / 7) * 20

  const f4 = week.length >= lastWeek.length ? 15 : (week.length / Math.max(1, lastWeek.length)) * 15

  return Math.round(f1 + f2 + f3 + f4)
}

function calculateSleepScore(dateStr: string, entries: Entry[]): number {
  const week = weekEntries(entries, 'sleep', dateStr)
  if (week.length === 0) return 75

  const durations = week.map((e) => (e.fields as any).duration).filter((v) => typeof v === 'number')
  const avgHours = durations.length > 0 ? avg(durations) / 60 : 7.5
  const f1 = Math.min(1, avgHours / 7.5) * 35

  const qualities = week.map((e) => (e.fields as any).quality).filter((v) => typeof v === 'number')
  const f2 = (avg(qualities) / 10) * 35

  let f3 = 20
  if (week.length > 1) {
    const hours = week.map((e) => new Date(e.timestamp).getHours())
    const meanH = avg(hours)
    const deviations = hours.map((h) => Math.min(Math.abs(h - meanH), 24 - Math.abs(h - meanH)))
    const avgDev = avg(deviations)
    if (avgDev <= 1) f3 = 20
    else if (avgDev <= 2) f3 = 10
    else f3 = 0
  }

  const lastWeek = lastWeekEntries(entries, 'sleep', dateStr)
  const lastDurations = lastWeek.map((e) => (e.fields as any).duration).filter((v) => typeof v === 'number')
  const lastAvgHours = lastDurations.length > 0 ? avg(lastDurations) / 60 : 7.5
  const f4 = avgHours >= lastAvgHours ? 10 : (avgHours / Math.max(0.1, lastAvgHours)) * 10

  return Math.round(f1 + f2 + f3 + f4)
}

function calculateFinanceScore(dateStr: string, entries: Entry[], goals: Goal[]): number {
  const b = getDateBoundaries(dateStr)
  const month = entries.filter(
    (e) => e.category === 'finance' && e.timestamp.split('T')[0] >= b.firstOfMonth && e.timestamp.split('T')[0] <= dateStr
  )

  let income = 0, expenses = 0, impulse = 0
  month.forEach((e) => {
    const amt = (e.fields as any).amount || 0
    if (e.subcategory === 'Einnahme') {
      income += amt
    } else if (['Ausgabe', 'Schulden'].includes(e.subcategory)) {
      expenses += amt
      if ((e.fields as any).impulseBuy === true) impulse += amt
    }
  })

  const savingsRate = income > 0 ? (income - expenses) / income : 0
  const f1 = savingsRate >= 0.2 ? 40 : savingsRate > 0 ? (savingsRate / 0.2) * 40 : 0

  const activeGoals = goals.filter((g) => g.category === 'finance' && !g.achieved)
  let f2 = 30
  if (activeGoals.length > 0) {
    const onTrack = activeGoals.filter((g) => !g.deadline || new Date(g.deadline) >= new Date(dateStr))
    f2 = (onTrack.length / activeGoals.length) * 30
  }

  const impulseRatio = expenses > 0 ? impulse / expenses : 0
  const f3 = (1 - impulseRatio) * 20

  const lastMonth = entries.filter(
    (e) => e.category === 'finance' && e.timestamp.split('T')[0] >= b.firstOfLastMonth && e.timestamp.split('T')[0] <= b.lastOfLastMonth
  )
  let lastIncome = 0, lastExpenses = 0
  lastMonth.forEach((e) => {
    const amt = (e.fields as any).amount || 0
    if (e.subcategory === 'Einnahme') lastIncome += amt
    else if (['Ausgabe', 'Schulden'].includes(e.subcategory)) lastExpenses += amt
  })
  const lastSavingsRate = lastIncome > 0 ? (lastIncome - lastExpenses) / lastIncome : 0
  const f4 = savingsRate >= lastSavingsRate ? 10 : 0

  return Math.round(f1 + f2 + f3 + f4)
}

function calculateSocialScore(dateStr: string, entries: Entry[]): number {
  const week = weekEntries(entries, 'social', dateStr)

  const SOCIAL_SUBS = ['Freunde', 'Familie', 'Partner', 'Party', 'Event', 'Networking', 'Online']
  const socialCount = week.filter((e) => SOCIAL_SUBS.includes(e.subcategory)).length
  const aloneCount = week.filter((e) => e.subcategory === 'Allein').length
  const total = socialCount + aloneCount
  const ratio = total > 0 ? socialCount / total : 0.5
  const f1 = ratio >= 0.3 && ratio <= 0.7 ? 35 : Math.max(0, 35 - Math.abs(ratio - 0.5) * 70)

  const energyMap: Record<string, number> = { drained: 1, neutral: 5, energized: 10 }
  const energyVals = week
    .map((e) => (e.fields as any).energyAfter)
    .filter(Boolean)
    .map((v) => energyMap[v] ?? 5)
  const f2 = (avg(energyVals) / 10) * 35 || 17.5

  const qualities = week.map((e) => (e.fields as any).quality).filter((v) => typeof v === 'number')
  const f3 = (avg(qualities) / 10) * 20 || 10

  const lastWeek = lastWeekEntries(entries, 'social', dateStr)
  const f4 = week.length >= lastWeek.length ? 10 : 5

  return Math.round(f1 + f2 + f3 + f4)
}

function calculateWorkScore(dateStr: string, entries: Entry[], goals: Goal[]): number {
  const week = weekEntries(entries, 'work', dateStr)
  const lastWeek = lastWeekEntries(entries, 'work', dateStr)

  const goalHours = goals.find((g) => g.category === 'work' && !g.achieved)?.targetValue ?? 20
  const deepWorkMins = week
    .filter((e) => ['Deep Work', e.subcategory].includes('Deep Work') && (e.fields as any).sessionType === 'Deep Work' || e.subcategory === 'Deep Work')
    .reduce((sum, e) => sum + ((e.fields as any).duration || 0), 0)
  const f1 = Math.min(1, deepWorkMins / 60 / goalHours) * 40

  const focusScores = week.map((e) => (e.fields as any).focusScore).filter((v) => typeof v === 'number')
  const f2 = (avg(focusScores) / 10) * 30 || 15

  const flowSessions = week.filter(
    (e) => e.subcategory === 'Flow State' || (e.fields as any).sessionType === 'Flow State'
  ).length
  const f3 = Math.min(1, flowSessions / 3) * 15

  const lastDeepMins = lastWeek
    .filter((e) => e.subcategory === 'Deep Work' || (e.fields as any).sessionType === 'Deep Work')
    .reduce((sum, e) => sum + ((e.fields as any).duration || 0), 0)
  const f4 = deepWorkMins >= lastDeepMins ? 15 : (deepWorkMins / Math.max(0.1, lastDeepMins)) * 15

  return Math.round(f1 + f2 + f3 + f4)
}

function calculateNutritionScore(dateStr: string, entries: Entry[]): number {
  const week = weekEntries(entries, 'nutrition', dateStr)
  const lastWeek = lastWeekEntries(entries, 'nutrition', dateStr)

  const meals = week.filter((e) => e.subcategory === 'Mahlzeit').length
  const f1 = Math.min(1, meals / 14) * 40

  const qualities = week.map((e) => (e.fields as any).quality).filter((v) => typeof v === 'number')
  const f2 = (avg(qualities) / 10) * 35 || 17.5

  const totalWater = week
    .filter((e) => e.subcategory === 'Wasser')
    .reduce((sum, e) => sum + ((e.fields as any).amountMl || (e.fields as any).water || 0), 0)
  const f3 = Math.min(1, totalWater / 7 / 2000) * 15

  const lastMeals = lastWeek.filter((e) => e.subcategory === 'Mahlzeit').length
  const f4 = meals >= lastMeals ? 10 : 5

  return Math.round(f1 + f2 + f3 + f4)
}

function calculateHealthScore(dateStr: string, entries: Entry[]): number {
  const week = weekEntries(entries, 'health', dateStr)

  const medsCount = week.filter((e) => ['Medikament', 'Supplement'].includes(e.subcategory)).length
  const f1 = Math.min(1, medsCount / 7) * 40

  const energyEntries = week.filter((e) => e.subcategory === 'Energie')
  let f2 = 17.5
  if (energyEntries.length > 0) {
    const energyVals = energyEntries.map((e) => (e.fields as any).energy ?? 5).filter((v) => typeof v === 'number')
    f2 = (avg(energyVals) / 10) * 35
  }

  const symptoms = week.filter((e) => ['Krank', 'Symptom'].includes(e.subcategory)).length
  let f3 = 25
  if (symptoms === 1) f3 = 20
  else if (symptoms === 2) f3 = 15
  else if (symptoms === 3) f3 = 10
  else if (symptoms === 4) f3 = 5
  else if (symptoms >= 5) f3 = 0

  return Math.round(f1 + f2 + f3)
}

function calculateSubstancesScore(dateStr: string, entries: Entry[]): number {
  const week = weekEntries(entries, 'substances', dateStr)
  const lastWeek = lastWeekEntries(entries, 'substances', dateStr)

  const HARD = ['Joint', 'Blüten', 'Zigarette', 'Alkohol']
  const hardCount = week.filter((e) => HARD.includes(e.subcategory)).length

  // Abstinence from hard substances (50%)
  let f1 = 50
  if (hardCount === 0) f1 = 50
  else if (hardCount <= 2) f1 = 38
  else if (hardCount <= 5) f1 = 22
  else if (hardCount <= 10) f1 = 10
  else f1 = 0

  // Caffeine moderation — avg ≤2/day is fine (30%)
  const caffeineCount = week.filter((e) => ['Kaffee', 'Energy Drink'].includes(e.subcategory)).length
  const avgDaily = caffeineCount / 7
  const f2 = avgDaily <= 2 ? 30 : avgDaily <= 3 ? 20 : avgDaily <= 5 ? 10 : 0

  // Trend vs last week — fewer hard uses = better (20%)
  const lastHard = lastWeek.filter((e) => HARD.includes(e.subcategory)).length
  const f3 = hardCount <= lastHard ? 20 : (lastHard / Math.max(1, hardCount)) * 20

  return Math.round(f1 + f2 + f3)
}

function calculateMoodScore(dateStr: string, entries: Entry[]): number {
  const week = weekEntries(entries, 'mood', dateStr)
  if (week.length === 0) return 75

  const POSITIVE = new Set(['Happy', 'Relaxed', 'Motivated', 'Euphoric', 'Grateful', 'Excited', 'Calm'])
  const NEGATIVE = new Set(['Sad', 'Stressed', 'Angry', 'Anxious', 'Depressed', 'Frustrated', 'Lonely'])

  // Valence-weighted score (50%)
  const valenceScores = week.map((e) => {
    const intensity = (e.fields as any).intensity ?? 5
    const emotion = e.subcategory
    if (POSITIVE.has(emotion)) return intensity
    if (NEGATIVE.has(emotion)) return 10 - intensity
    return 5 // Tired, Neutral
  })
  const f1 = (avg(valenceScores) / 10) * 50

  // Trend vs last week (30%)
  const lastWeek = lastWeekEntries(entries, 'mood', dateStr)
  const thisPositive = week.filter((e) => POSITIVE.has(e.subcategory)).length
  const lastPositive = lastWeek.filter((e) => POSITIVE.has(e.subcategory)).length
  const f2 = thisPositive >= lastPositive ? 30 : (thisPositive / Math.max(1, lastPositive)) * 30

  // Logging consistency — at least 5 unique days this week (20%)
  const uniqueDays = new Set(week.map((e) => e.timestamp.split('T')[0])).size
  const f3 = Math.min(1, uniqueDays / 5) * 20

  return Math.round(f1 + f2 + f3)
}

function calculateIntimacyScore(dateStr: string, entries: Entry[]): number {
  const week = weekEntries(entries, 'intimacy', dateStr)
  const lastWeek = lastWeekEntries(entries, 'intimacy', dateStr)

  const CONNECTION = new Set(['Sex', 'Kiss', 'Date', 'Flirt', 'Cuddling'])
  const connections = week.filter((e) => CONNECTION.has(e.subcategory)).length

  // Connection frequency vs 2/week target (40%)
  const f1 = Math.min(1, connections / 2) * 40

  // Partner quality / satisfaction (35%)
  const qualities = week
    .map((e) => (e.fields as any).partnerQuality ?? (e.fields as any).quality)
    .filter((v) => typeof v === 'number')
  const f2 = qualities.length > 0 ? (avg(qualities) / 10) * 35 : 17.5

  // Trend vs last week (25%)
  const lastConnections = lastWeek.filter((e) => CONNECTION.has(e.subcategory)).length
  const f3 = connections >= lastConnections ? 25 : (connections / Math.max(1, lastConnections)) * 25

  return Math.round(f1 + f2 + f3)
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

function calculateRawScore(cat: CategoryId, dateStr: string, entries: Entry[], goals: Goal[]): number {
  switch (cat) {
    case 'fitness':    return calculateFitnessScore(dateStr, entries, goals)
    case 'sleep':      return calculateSleepScore(dateStr, entries)
    case 'finance':    return calculateFinanceScore(dateStr, entries, goals)
    case 'social':     return calculateSocialScore(dateStr, entries)
    case 'work':       return calculateWorkScore(dateStr, entries, goals)
    case 'nutrition':  return calculateNutritionScore(dateStr, entries)
    case 'health':     return calculateHealthScore(dateStr, entries)
    case 'substances': return calculateSubstancesScore(dateStr, entries)
    case 'mood':       return calculateMoodScore(dateStr, entries)
    case 'intimacy':   return calculateIntimacyScore(dateStr, entries)
    default:           return 0
  }
}

const ALL_CATEGORIES: CategoryId[] = [
  'substances', 'intimacy', 'fitness', 'sleep', 'mood',
  'nutrition', 'finance', 'social', 'work', 'health',
]

const DEFAULT_WEIGHTS: Record<string, number> = {
  sleep: 25, fitness: 20, work: 20, finance: 15,
  social: 10, nutrition: 5, health: 5, mood: 5,
  substances: 5, intimacy: 5,
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useScoreStore = create<ScoreState>()(
  persist(
    (set, get) => ({
      history: [],

      calculateAllScoresForDate: (dateStr) => {
        const entries = useEntriesStore.getState().entries
        const goals = useGoalsStore.getState().goals
        const profile = useProfileStore.getState().profile

        // Freeze to last logged day if nothing today
        const hasAnyToday = entries.some((e) => e.timestamp.startsWith(dateStr))
        if (!hasAnyToday) {
          const lastDay = Array.from(new Set(entries.map((e) => e.timestamp.split('T')[0])))
            .filter((d) => d < dateStr)
            .sort((a, b) => b.localeCompare(a))[0]

          if (lastDay) {
            return { ...get().calculateAllScoresForDate(lastDay), isFrozen: true, frozenDate: lastDay }
          }
        }

        const selectedCats = (profile.selectedCategories?.length
          ? profile.selectedCategories
          : ALL_CATEGORIES) as CategoryId[]

        const weights: Record<string, number> = { ...DEFAULT_WEIGHTS, ...(profile.scoreWeights ?? {}) }

        const categoriesResult = {} as Record<CategoryId, CategoryScoreDetail>

        selectedCats.forEach((catId) => {
          const hasToday = entries.some((e) => e.category === catId && e.timestamp.startsWith(dateStr))

          if (hasToday) {
            const raw = calculateRawScore(catId, dateStr, entries, goals)
            categoriesResult[catId] = { score: raw, lastScore: raw, status: 'normal' }
            return
          }

          const prevEntries = entries
            .filter((e) => e.category === catId && e.timestamp.split('T')[0] < dateStr)
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

          if (prevEntries.length === 0) {
            categoriesResult[catId] = { score: null, lastScore: 0, status: 'grayed_out' }
            return
          }

          const lastDate = prevEntries[0].timestamp.split('T')[0]
          const daysSince = getDaysBetween(dateStr, lastDate)
          const lastRaw = calculateRawScore(catId, lastDate, entries, goals)

          if (daysSince === 1) {
            // Silent freeze: only first missed day this week gets 100% carry
            const b = getDateBoundaries(dateStr)
            let missedThisWeek = 0
            const c = new Date(dateStr)
            c.setDate(c.getDate() - 1)
            while (c.toISOString().split('T')[0] >= b.monday) {
              const cs = c.toISOString().split('T')[0]
              if (!entries.some((e) => e.category === catId && e.timestamp.startsWith(cs))) missedThisWeek++
              c.setDate(c.getDate() - 1)
            }
            if (missedThisWeek === 0) {
              categoriesResult[catId] = { score: lastRaw, lastScore: lastRaw, status: 'normal' }
            } else {
              categoriesResult[catId] = { score: Math.round(lastRaw * 0.9), lastScore: lastRaw, status: 'carry_90' }
            }
          } else if (daysSince === 2) {
            categoriesResult[catId] = { score: Math.round(lastRaw * 0.75), lastScore: lastRaw, status: 'carry_75' }
          } else {
            categoriesResult[catId] = { score: null, lastScore: lastRaw, status: 'grayed_out' }
          }
        })

        // Fill unselected categories as grayed out
        ALL_CATEGORIES.forEach((id) => {
          if (!categoriesResult[id]) {
            categoriesResult[id] = { score: null, lastScore: 0, status: 'grayed_out' }
          }
        })

        // Weighted overall from categories that have a score
        const scored = selectedCats.filter((id) => categoriesResult[id].score !== null)
        if (scored.length === 0) return { overall: null, categories: categoriesResult, isFrozen: false }

        const totalWeight = scored.reduce((s, id) => s + (weights[id] ?? 0), 0)
        const overall =
          totalWeight === 0
            ? Math.round(scored.reduce((s, id) => s + (categoriesResult[id].score ?? 0), 0) / scored.length)
            : Math.round(scored.reduce((s, id) => s + (categoriesResult[id].score ?? 0) * ((weights[id] ?? 0) / totalWeight), 0))

        return { overall, categories: categoriesResult, isFrozen: false }
      },

      saveDailyScore: async (dateStr) => {
        const scores = get().calculateAllScoresForDate(dateStr)
        const authUserId = useProfileStore.getState().authUserId

        const categoryScoresDb = Object.fromEntries(
          Object.entries(scores.categories).map(([k, v]) => [k, v.score])
        )

        const newItem: ScoreHistoryItem = {
          id: '',
          user_id: authUserId ?? 'guest',
          date: dateStr,
          overall_score: scores.overall,
          category_scores: categoryScoresDb,
        }

        set((state) => {
          const idx = state.history.findIndex((h) => h.date === dateStr)
          const item = { ...newItem, id: idx >= 0 ? state.history[idx].id : Math.random().toString() }
          const next = [...state.history]
          if (idx >= 0) next[idx] = item
          else next.push(item)
          return { history: next }
        })

        if (authUserId) {
          try {
            await (supabase as any).from('score_history').upsert(
              { user_id: authUserId, date: dateStr, overall_score: scores.overall, category_scores: categoryScoresDb },
              { onConflict: 'user_id,date' }
            )
          } catch (err) {
            console.error('[Score] Supabase sync error:', err)
          }
        }
      },

      loadHistory: async () => {
        const authUserId = useProfileStore.getState().authUserId
        if (!authUserId) return
        try {
          const { data, error } = await (supabase as any)
            .from('score_history')
            .select('*')
            .eq('user_id', authUserId)
            .order('date', { ascending: false })
          if (error) throw error
          if (data) set({ history: data })
        } catch (err) {
          console.error('[Score] Load history error:', err)
        }
      },

      clearAll: () => set({ history: [] }),
    }),
    {
      name: 'lyfe-scores',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
