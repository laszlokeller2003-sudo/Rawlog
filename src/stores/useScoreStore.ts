import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { useEntriesStore } from './useEntriesStore'
import { useGoalsStore } from './useGoalsStore'
import { useProfileStore } from './useProfileStore'
import type { CategoryId, Entry, Goal } from '@/types'
import { toDateString } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

export interface CategoryScoreDetail {
  score: number | null
  lastScore: number
  status: 'normal' | 'carry_90' | 'carry_75' | 'grayed_out'
}

export interface ScoreHistoryItem {
  id: string
  user_id: string
  date: string // YYYY-MM-DD
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

// ─── Helper: Date Boundaries ───────────────────────────────────────────────────

function getDateBoundaries(dateStr: string) {
  const target = new Date(dateStr)

  // Current Week (Monday to Sunday)
  const day = target.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(target)
  monday.setDate(target.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  // Last Week
  const lastMonday = new Date(monday)
  lastMonday.setDate(monday.getDate() - 7)
  const lastSunday = new Date(lastMonday)
  lastSunday.setDate(lastMonday.getDate() + 6)
  lastSunday.setHours(23, 59, 59, 999)

  // Current Month
  const firstOfMonth = new Date(target.getFullYear(), target.getMonth(), 1)
  const lastOfMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0, 23, 59, 59, 999)

  // Last Month
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

// ─── Helper: Days Between ──────────────────────────────────────────────────────

function getDaysBetween(d1: string, d2: string): number {
  const timeDiff = new Date(d1).getTime() - new Date(d2).getTime()
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24))
}

// ─── Raw Category Calculations ──────────────────────────────────────────────────

function calculateFitnessScoreRaw(dateStr: string, entries: Entry[], goals: Goal[]): number {
  const bounds = getDateBoundaries(dateStr)
  const weekEntries = entries.filter(
    (e) => e.category === 'fitness' && e.timestamp.split('T')[0] >= bounds.monday && e.timestamp.split('T')[0] <= dateStr
  )

  // 1. Sessions vs Weekly Goal (default 3)
  const activeFitnessGoal = goals.find((g) => g.category === 'fitness' && !g.achieved)
  const target = activeFitnessGoal?.targetValue ?? 3
  const sessions = weekEntries.length
  const f1 = Math.min(1, sessions / target) * 40

  // 2. Average Intensity this week (25%)
  const intensities = weekEntries
    .map((e) => (e.fields as any).intensity)
    .filter((v) => typeof v === 'number')
  const avgIntensity = intensities.length > 0 ? intensities.reduce((a, b) => a + b, 0) / intensities.length : 0
  const f2 = (avgIntensity / 10) * 25

  // 3. Current Streak (20%) - consecutive workout days ending on or before dateStr
  let streak = 0
  let checkDate = new Date(dateStr)
  for (let i = 0; i < 7; i++) {
    const checkDateStr = checkDate.toISOString().split('T')[0]
    const hasWorkout = entries.some(
      (e) => e.category === 'fitness' && e.timestamp.startsWith(checkDateStr)
    )
    if (hasWorkout) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }
  const f3 = Math.min(1, streak / 7) * 20

  // 4. Trend vs last week (15%)
  const lastWeekEntries = entries.filter(
    (e) => e.category === 'fitness' && e.timestamp.split('T')[0] >= bounds.lastMonday && e.timestamp.split('T')[0] <= bounds.lastSunday
  )
  const lastSessions = lastWeekEntries.length
  const f4 = sessions >= lastSessions ? 15 : (sessions / Math.max(1, lastSessions)) * 15

  return Math.round(f1 + f2 + f3 + f4)
}

function calculateSleepScoreRaw(dateStr: string, entries: Entry[]): number {
  const bounds = getDateBoundaries(dateStr)
  const weekEntries = entries.filter(
    (e) => e.category === 'sleep' && e.timestamp.split('T')[0] >= bounds.monday && e.timestamp.split('T')[0] <= dateStr
  )

  if (weekEntries.length === 0) {
    // If no sleep entries this week, return default base sleep score
    return 75
  }

  // 1. Average hours vs 7.5h target (35%)
  const durations = weekEntries
    .map((e) => (e.fields as any).duration)
    .filter((v) => typeof v === 'number') // duration in minutes
  const avgHours = durations.length > 0 ? (durations.reduce((a, b) => a + b, 0) / durations.length) / 60 : 7.5
  const f1 = Math.min(1, avgHours / 7.5) * 35

  // 2. Average quality (35%)
  const qualities = weekEntries
    .map((e) => (e.fields as any).quality)
    .filter((v) => typeof v === 'number')
  const avgQuality = qualities.length > 0 ? qualities.reduce((a, b) => a + b, 0) / qualities.length : 7.5
  const f2 = (avgQuality / 10) * 35

  // 3. Bedtime consistency ±1h (20%)
  let f3 = 20
  if (weekEntries.length > 1) {
    // Get hour of sleep entries (0-23)
    const hours = weekEntries.map((e) => new Date(e.timestamp).getHours())
    const avgH = hours.reduce((a, b) => a + b, 0) / hours.length
    // Calculate mean deviation handling wrap-around
    const deviations = hours.map((h) => Math.min(Math.abs(h - avgH), 24 - Math.abs(h - avgH)))
    const avgDev = deviations.reduce((a, b) => a + b, 0) / deviations.length
    if (avgDev <= 1) f3 = 20
    else if (avgDev <= 2) f3 = 10
    else f3 = 0
  }

  // 4. Trend vs last week (10%)
  const lastWeekEntries = entries.filter(
    (e) => e.category === 'sleep' && e.timestamp.split('T')[0] >= bounds.lastMonday && e.timestamp.split('T')[0] <= bounds.lastSunday
  )
  const lastDurations = lastWeekEntries
    .map((e) => (e.fields as any).duration)
    .filter((v) => typeof v === 'number')
  const lastAvgHours = lastDurations.length > 0 ? (lastDurations.reduce((a, b) => a + b, 0) / lastDurations.length) / 60 : 7.5
  const f4 = avgHours >= lastAvgHours ? 10 : (avgHours / Math.max(0.1, lastAvgHours)) * 10

  return Math.round(f1 + f2 + f3 + f4)
}

function calculateFinanceScoreRaw(dateStr: string, entries: Entry[], goals: Goal[]): number {
  const bounds = getDateBoundaries(dateStr)
  const monthEntries = entries.filter(
    (e) => e.category === 'finance' && e.timestamp.split('T')[0] >= bounds.firstOfMonth && e.timestamp.split('T')[0] <= dateStr
  )

  // 1. Savings Rate target >20% (40%)
  let income = 0
  let expenses = 0
  let impulse = 0
  monthEntries.forEach((e) => {
    const amt = (e.fields as any).amount || 0
    if (e.subcategory === 'Income') {
      income += amt
    } else if (['Expense', 'Impulse buy', 'Subscription'].includes(e.subcategory)) {
      expenses += amt
      if (e.subcategory === 'Impulse buy') {
        impulse += amt
      }
    }
  })
  const savingsRate = income > 0 ? (income - expenses) / income : 0
  const f1 = savingsRate >= 0.20 ? 40 : savingsRate > 0 ? (savingsRate / 0.20) * 40 : 0

  // 2. Goals on Track (30%)
  const activeFinanceGoals = goals.filter((g) => g.category === 'finance' && !g.achieved)
  let f2 = 30
  if (activeFinanceGoals.length > 0) {
    const onTrackGoals = activeFinanceGoals.filter((g) => {
      if (!g.deadline) return true
      return new Date(g.deadline) >= new Date(dateStr)
    })
    f2 = (onTrackGoals.length / activeFinanceGoals.length) * 30
  }

  // 3. Impulse buys vs total expenses (20%) - lower is better
  const impulseRatio = expenses > 0 ? impulse / expenses : 0
  const f3 = (1 - impulseRatio) * 20

  // 4. Trend vs last month (10%)
  const lastMonthEntries = entries.filter(
    (e) => e.category === 'finance' && e.timestamp.split('T')[0] >= bounds.firstOfLastMonth && e.timestamp.split('T')[0] <= bounds.lastOfLastMonth
  )
  let lastIncome = 0
  let lastExpenses = 0
  lastMonthEntries.forEach((e) => {
    const amt = (e.fields as any).amount || 0
    if (e.subcategory === 'Income') lastIncome += amt
    else if (['Expense', 'Impulse buy', 'Subscription'].includes(e.subcategory)) lastExpenses += amt
  })
  const lastSavingsRate = lastIncome > 0 ? (lastIncome - lastExpenses) / lastIncome : 0
  const f4 = savingsRate >= lastSavingsRate ? 10 : 0

  return Math.round(f1 + f2 + f3 + f4)
}

function calculateSocialScoreRaw(dateStr: string, entries: Entry[]): number {
  const bounds = getDateBoundaries(dateStr)
  const weekEntries = entries.filter(
    (e) => e.category === 'social' && e.timestamp.split('T')[0] >= bounds.monday && e.timestamp.split('T')[0] <= dateStr
  )

  const socialSubcategories = ['Friends', 'Family', 'Partner', 'Party', 'Event', 'Networking', 'Online call']
  const socialEvents = weekEntries.filter((e) => socialSubcategories.includes(e.subcategory)).length
  const aloneTime = weekEntries.filter((e) => e.subcategory === 'Alone time').length

  // 1. Balance social events vs alone time (35%)
  const totalSocial = socialEvents + aloneTime
  const ratio = totalSocial > 0 ? socialEvents / totalSocial : 0.5
  const f1 = ratio >= 0.3 && ratio <= 0.7 ? 35 : Math.max(0, 35 - Math.abs(ratio - 0.5) * 70)

  // 2. Average energy after (35%)
  const energyMapping: Record<string, number> = { drained: 1, neutral: 5, energized: 10 }
  const energyValues = weekEntries
    .map((e) => (e.fields as any).energyAfter)
    .filter(Boolean)
    .map((v) => energyMapping[v] ?? 5)
  const avgEnergy = energyValues.length > 0 ? energyValues.reduce((a, b) => a + b, 0) / energyValues.length : 7.5
  const f2 = (avgEnergy / 10) * 35

  // 3. Average quality rating (20%)
  const qualities = weekEntries
    .map((e) => (e.fields as any).quality)
    .filter((v) => typeof v === 'number')
  const avgQuality = qualities.length > 0 ? qualities.reduce((a, b) => a + b, 0) / qualities.length : 7.5
  const f3 = (avgQuality / 10) * 20

  // 4. Trend vs last week (10%)
  const lastWeekEntries = entries.filter(
    (e) => e.category === 'social' && e.timestamp.split('T')[0] >= bounds.lastMonday && e.timestamp.split('T')[0] <= bounds.lastSunday
  )
  const f4 = weekEntries.length >= lastWeekEntries.length ? 10 : 5

  return Math.round(f1 + f2 + f3 + f4)
}

function calculateWorkScoreRaw(dateStr: string, entries: Entry[], goals: Goal[]): number {
  const bounds = getDateBoundaries(dateStr)
  const weekEntries = entries.filter(
    (e) => e.category === 'work' && e.timestamp.split('T')[0] >= bounds.monday && e.timestamp.split('T')[0] <= dateStr
  )

  // 1. Deep work hours vs weekly goal (default 20h) (40%)
  const activeWorkGoal = goals.find((g) => g.category === 'work' && !g.achieved)
  const goalHours = activeWorkGoal?.targetValue ?? 20
  const deepWorkMinutes = weekEntries
    .filter((e) => e.subcategory === 'Deep Work')
    .reduce((sum, e) => sum + ((e.fields as any).duration || 0), 0)
  const deepWorkHours = deepWorkMinutes / 60
  const f1 = Math.min(1, deepWorkHours / goalHours) * 40

  // 2. Average focus score (30%)
  const focusScores = weekEntries
    .map((e) => (e.fields as any).focusScore)
    .filter((v) => typeof v === 'number')
  const avgFocus = focusScores.length > 0 ? focusScores.reduce((a, b) => a + b, 0) / focusScores.length : 7.5
  const f2 = (avgFocus / 10) * 30

  // 3. Flow State Sessions (15%) - capped at 3/week
  const flowStateSessions = weekEntries.filter((e) => e.subcategory === 'Flow State').length
  const f3 = Math.min(1, flowStateSessions / 3) * 15

  // 4. Trend vs last week (15%)
  const lastWeekEntries = entries.filter(
    (e) => e.category === 'work' && e.timestamp.split('T')[0] >= bounds.lastMonday && e.timestamp.split('T')[0] <= bounds.lastSunday
  )
  const lastDeepWorkMinutes = lastWeekEntries
    .filter((e) => e.subcategory === 'Deep Work')
    .reduce((sum, e) => sum + ((e.fields as any).duration || 0), 0)
  const lastDeepWorkHours = lastDeepWorkMinutes / 60
  const f4 = deepWorkHours >= lastDeepWorkHours ? 15 : (deepWorkHours / Math.max(0.1, lastDeepWorkHours)) * 15

  return Math.round(f1 + f2 + f3 + f4)
}

function calculateNutritionScoreRaw(dateStr: string, entries: Entry[]): number {
  const bounds = getDateBoundaries(dateStr)
  const weekEntries = entries.filter(
    (e) => e.category === 'nutrition' && e.timestamp.split('T')[0] >= bounds.monday && e.timestamp.split('T')[0] <= dateStr
  )

  // 1. Meals logged vs goal (default 14 meals) (40%)
  const mealsLogged = weekEntries.filter((e) =>
    ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Cheat Meal'].includes(e.subcategory)
  ).length
  const f1 = Math.min(1, mealsLogged / 14) * 40

  // 2. Average quality rating (35%)
  const qualities = weekEntries
    .map((e) => (e.fields as any).quality)
    .filter((v) => typeof v === 'number')
  const avgQuality = qualities.length > 0 ? qualities.reduce((a, b) => a + b, 0) / qualities.length : 7.5
  const f2 = (avgQuality / 10) * 35

  // 3. Water Intake vs goal (default 2000ml) (15%)
  const totalWater = weekEntries
    .map((e) => (e.fields as any).water || 0)
    .reduce((a, b) => a + b, 0)
  const avgDailyWater = totalWater / 7
  const f3 = Math.min(1, avgDailyWater / 2000) * 15

  // 4. Trend vs last week (10%)
  const lastWeekEntries = entries.filter(
    (e) => e.category === 'nutrition' && e.timestamp.split('T')[0] >= bounds.lastMonday && e.timestamp.split('T')[0] <= bounds.lastSunday
  )
  const lastMeals = lastWeekEntries.filter((e) =>
    ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Cheat Meal'].includes(e.subcategory)
  ).length
  const f4 = mealsLogged >= lastMeals ? 10 : 5

  return Math.round(f1 + f2 + f3 + f4)
}

function calculateHealthScoreRaw(dateStr: string, entries: Entry[]): number {
  const bounds = getDateBoundaries(dateStr)
  const weekEntries = entries.filter(
    (e) => e.category === 'health' && e.timestamp.split('T')[0] >= bounds.monday && e.timestamp.split('T')[0] <= dateStr
  )

  // 1. Medication adherence (default 7 doses/week) (40%)
  const medsCount = weekEntries.filter((e) => ['Medication', 'Supplement'].includes(e.subcategory)).length
  const f1 = Math.min(1, medsCount / 7) * 40

  // 2. Energy levels trend (35%)
  const highs = weekEntries.filter((e) => e.subcategory === 'High energy').length
  const lows = weekEntries.filter((e) => e.subcategory === 'Low energy').length
  const ratio = (highs + lows) > 0 ? highs / (highs + lows) : 0.5
  const f2 = ratio * 35

  // 3. Symptom frequency lower = better (25%)
  const symptoms = weekEntries.filter((e) => ['Sick', 'Headache', 'Pain'].includes(e.subcategory)).length
  let f3 = 25
  if (symptoms === 1) f3 = 20
  else if (symptoms === 2) f3 = 15
  else if (symptoms === 3) f3 = 10
  else if (symptoms === 4) f3 = 5
  else if (symptoms >= 5) f3 = 0

  return Math.round(f1 + f2 + f3)
}

function calculateRawScore(categoryId: CategoryId, dateStr: string, entries: Entry[], goals: Goal[]): number {
  switch (categoryId) {
    case 'fitness':
      return calculateFitnessScoreRaw(dateStr, entries, goals)
    case 'sleep':
      return calculateSleepScoreRaw(dateStr, entries)
    case 'finance':
      return calculateFinanceScoreRaw(dateStr, entries, goals)
    case 'social':
      return calculateSocialScoreRaw(dateStr, entries)
    case 'work':
      return calculateWorkScoreRaw(dateStr, entries, goals)
    case 'nutrition':
      return calculateNutritionScoreRaw(dateStr, entries)
    case 'health':
      return calculateHealthScoreRaw(dateStr, entries)
    default:
      return 0
  }
}

// ─── useScoreStore Store ──────────────────────────────────────────────────────────

export const useScoreStore = create<ScoreState>()(
  persist(
    (set, get) => ({
      history: [],

      calculateAllScoresForDate: (dateStr) => {
        const entries = useEntriesStore.getState().entries
        const goals = useGoalsStore.getState().goals
        const profile = useProfileStore.getState().profile

        // Check overall freeze: No entries logged today at all?
        const entriesToday = entries.filter((e) => e.timestamp.startsWith(dateStr))
        const hasAnyEntriesToday = entriesToday.length > 0

        if (!hasAnyEntriesToday) {
          // FREEZE: Find the most recent day before dateStr with entries
          const daysWithEntries = Array.from(new Set(entries.map((e) => e.timestamp.split('T')[0])))
            .filter((d) => d < dateStr)
            .sort((a, b) => b.localeCompare(a))

          if (daysWithEntries.length > 0) {
            const frozenDate = daysWithEntries[0]
            // Calculate scores on that frozen date
            const result = get().calculateAllScoresForDate(frozenDate)
            return {
              ...result,
              isFrozen: true,
              frozenDate,
            }
          }
        }

        // Determine active categories
        // Nutrition is active only if nutrition goals are active
        const hasNutritionGoals = goals.some((g) => g.category === 'nutrition' && !g.achieved)
        // Health is active only if health goals are active
        const hasHealthGoals = goals.some((g) => g.category === 'health' && !g.achieved)

        const activeCategories: CategoryId[] = ['sleep', 'fitness', 'work', 'finance', 'social']
        if (hasNutritionGoals) activeCategories.push('nutrition')
        if (hasHealthGoals) activeCategories.push('health')

        // Fetch user weights (or use default weights)
        const defaultWeights: Record<string, number> = {
          sleep: 25,
          fitness: 20,
          work: 20,
          finance: 15,
          social: 10,
          nutrition: 5,
          health: 5,
        }
        const weights = (profile as any).scoreWeights || defaultWeights

        const categoriesResult = {} as Record<CategoryId, CategoryScoreDetail>

        activeCategories.forEach((catId) => {
          // Check if category has entry today
          const hasEntryToday = entries.some(
            (e) => e.category === catId && e.timestamp.startsWith(dateStr)
          )

          if (hasEntryToday) {
            const raw = calculateRawScore(catId, dateStr, entries, goals)
            categoriesResult[catId] = {
              score: raw,
              lastScore: raw,
              status: 'normal',
            }
          } else {
            // Find last entry date for this category before dateStr
            const catEntriesBefore = entries
              .filter((e) => e.category === catId && e.timestamp.split('T')[0] < dateStr)
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

            if (catEntriesBefore.length === 0) {
              // No data ever
              categoriesResult[catId] = {
                score: null,
                lastScore: 0,
                status: 'grayed_out',
              }
            } else {
              const lastEntryDate = catEntriesBefore[0].timestamp.split('T')[0]
              const daysSince = getDaysBetween(dateStr, lastEntryDate)
              const lastRawScore = calculateRawScore(catId, lastEntryDate, entries, goals)

              if (daysSince === 1) {
                // Check Weekly Silent Freeze:
                // Let's see if we already used silent freeze this week (Monday to Sunday)
                const bounds = getDateBoundaries(dateStr)
                // To keep it simple, check if any day in [bounds.monday, dateStr) had a silent freeze used.
                // We'll define a silent freeze as being used if we did NOT log that category, but carried forward at 100%.
                // Let's check if there's any day in this week where daysSince was 1 and it was frozen at 100%.
                // If this is the first missed day this week, it's a silent freeze (100% carry forward).
                // Let's check how many days were missed this week before today.
                let missedDaysThisWeek = 0
                let checkDate = new Date(dateStr)
                checkDate.setDate(checkDate.getDate() - 1)
                while (checkDate.toISOString().split('T')[0] >= bounds.monday) {
                  const checkStr = checkDate.toISOString().split('T')[0]
                  const hasEntryOnDay = entries.some(
                    (e) => e.category === catId && e.timestamp.startsWith(checkStr)
                  )
                  if (!hasEntryOnDay) {
                    missedDaysThisWeek++
                  }
                  checkDate.setDate(checkDate.getDate() - 1)
                }

                const isSilentFreeze = missedDaysThisWeek === 0

                if (isSilentFreeze) {
                  categoriesResult[catId] = {
                    score: lastRawScore, // 100% carry forward
                    lastScore: lastRawScore,
                    status: 'normal', // treated as normal/zero impact
                  }
                } else {
                  categoriesResult[catId] = {
                    score: Math.round(lastRawScore * 0.90),
                    lastScore: lastRawScore,
                    status: 'carry_90',
                  }
                }
              } else if (daysSince === 2) {
                categoriesResult[catId] = {
                  score: Math.round(lastRawScore * 0.75),
                  lastScore: lastRawScore,
                  status: 'carry_75',
                }
              } else {
                categoriesResult[catId] = {
                  score: null,
                  lastScore: lastRawScore,
                  status: 'grayed_out',
                }
              }
            }
          }
        })

        // Fill in inactive categories as grayed out
        ;['sleep', 'fitness', 'work', 'finance', 'social', 'nutrition', 'health'].forEach((id) => {
          if (!categoriesResult[id as CategoryId]) {
            categoriesResult[id as CategoryId] = {
              score: null,
              lastScore: 0,
              status: 'grayed_out',
            }
          }
        })

        // Compute overall score
        // Only include active categories that are NOT grayed out and have data in last 3 days (i.e. score is not null)
        const categoriesForOverall = activeCategories.filter(
          (catId) => categoriesResult[catId].score !== null
        )

        if (categoriesForOverall.length === 0) {
          return {
            overall: null,
            categories: categoriesResult,
            isFrozen: false,
          }
        }

        let totalWeight = 0
        categoriesForOverall.forEach((catId) => {
          totalWeight += weights[catId] || 0
        })

        if (totalWeight === 0) {
          // If weights are 0, average them equally
          let sum = 0
          categoriesForOverall.forEach((catId) => {
            sum += categoriesResult[catId].score || 0
          })
          return {
            overall: Math.round(sum / categoriesForOverall.length),
            categories: categoriesResult,
            isFrozen: false,
          }
        }

        let weightedSum = 0
        categoriesForOverall.forEach((catId) => {
          const sc = categoriesResult[catId].score || 0
          const wt = weights[catId] || 0
          weightedSum += sc * (wt / totalWeight)
        })

        return {
          overall: Math.round(weightedSum),
          categories: categoriesResult,
          isFrozen: false,
        }
      },

      saveDailyScore: async (dateStr) => {
        const scores = get().calculateAllScoresForDate(dateStr)
        const authUserId = useProfileStore.getState().authUserId

        const categoryScoresDb = {} as Record<string, number | null>
        Object.entries(scores.categories).forEach(([k, v]) => {
          categoryScoresDb[k] = v.score
        })

        const item: Omit<ScoreHistoryItem, 'id'> = {
          user_id: authUserId || 'guest',
          date: dateStr,
          overall_score: scores.overall,
          category_scores: categoryScoresDb,
        }

        // Update local state history
        set((state) => {
          const existingIdx = state.history.findIndex((h) => h.date === dateStr)
          const newItem = { ...item, id: existingIdx >= 0 ? state.history[existingIdx].id : Math.random().toString() }
          const newHistory = [...state.history]
          if (existingIdx >= 0) {
            newHistory[existingIdx] = newItem
          } else {
            newHistory.push(newItem)
          }
          return { history: newHistory }
        })

        // Sync to Supabase if logged in
        if (authUserId) {
          try {
            const { error } = await (supabase as any)
              .from('score_history')
              .upsert({
                user_id: authUserId,
                date: dateStr,
                overall_score: scores.overall,
                category_scores: categoryScoresDb,
              }, { onConflict: 'user_id,date' })
            if (error) throw error
          } catch (err) {
            console.error('Failed to sync score history to Supabase:', err)
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
          if (data) {
            set({ history: data })
          }
        } catch (err) {
          console.error('Failed to load score history:', err)
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
