import type { Entry, Habit, Goal, UserProfile } from '@/types'
import { DEFAULT_CATEGORIES } from '@/lib/categories'
import { average, toDateString, calculateAge } from '@/lib/utils'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function buildDataContext(
  entries: Entry[],
  habits: Habit[],
  goals: Goal[],
  profile: UserProfile
): string {
  const lines: string[] = []

  // ── User Profile ───────────────────────────────────────────
  lines.push('=== USER PROFILE ===')
  lines.push(`Name: ${profile.name || 'Anonymous'}`)
  if (profile.dateOfBirth) {
    lines.push(`Age: ${calculateAge(profile.dateOfBirth)}`)
  }
  lines.push(`Language: ${profile.language.toUpperCase()}`)
  lines.push(`Currency: ${profile.currency}`)
  if (profile.goals.length > 0) {
    lines.push(`Life Goals: ${profile.goals.join(', ')}`)
  }
  lines.push(`Premium: ${profile.isPremium ? 'Yes' : 'No'}`)
  lines.push('')

  // ── Last 30 days entries ───────────────────────────────────
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const recentEntries = entries.filter(
    (e) => new Date(e.timestamp) >= thirtyDaysAgo
  )

  lines.push('=== LAST 30 DAYS ACTIVITY ===')
  lines.push(`Total entries logged: ${recentEntries.length}`)

  const countByCategory: Record<string, number> = {}
  for (const entry of recentEntries) {
    countByCategory[entry.category] = (countByCategory[entry.category] ?? 0) + 1
  }

  for (const cat of DEFAULT_CATEGORIES) {
    const count = countByCategory[cat.id] ?? 0
    if (count > 0) {
      lines.push(`  ${cat.icon} ${cat.name}: ${count} entries`)
    }
  }
  lines.push('')

  // ── Mood insights ──────────────────────────────────────────
  const moodEntries = recentEntries.filter((e) => e.category === 'mood')
  if (moodEntries.length > 0) {
    const intensities = moodEntries
      .map((e) => {
        const f = e.fields as { intensity?: number }
        return f.intensity
      })
      .filter((v): v is number => v !== undefined)
    if (intensities.length > 0) {
      lines.push(`Average mood score (last 30d): ${average(intensities).toFixed(1)}/10`)
    }
    const subcategories = moodEntries.map((e) => e.subcategory)
    const moodCounts: Record<string, number> = {}
    for (const s of subcategories) {
      moodCounts[s] = (moodCounts[s] ?? 0) + 1
    }
    const topMoods = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${k} (${v}x)`)
    lines.push(`Top mood states: ${topMoods.join(', ')}`)
    lines.push('')
  }

  // ── Sleep insights ─────────────────────────────────────────
  const sleepEntries = recentEntries.filter((e) => e.category === 'sleep')
  if (sleepEntries.length > 0) {
    const qualities = sleepEntries
      .map((e) => {
        const f = e.fields as { quality?: number; duration?: number }
        return { quality: f.quality, duration: f.duration }
      })

    const qualityValues = qualities.map((q) => q.quality).filter((v): v is number => v !== undefined)
    const durationValues = qualities.map((q) => q.duration).filter((v): v is number => v !== undefined)

    lines.push('=== SLEEP (last 30d) ===')
    if (qualityValues.length > 0) {
      lines.push(`Average sleep quality: ${average(qualityValues).toFixed(1)}/10`)
    }
    if (durationValues.length > 0) {
      const avgMinutes = average(durationValues)
      const h = Math.floor(avgMinutes / 60)
      const m = Math.round(avgMinutes % 60)
      lines.push(`Average sleep duration: ${h}h ${m}m`)
    }
    lines.push('')
  }

  // ── Finance this month ─────────────────────────────────────
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const financeEntries = entries.filter(
    (e) => e.category === 'finance' && new Date(e.timestamp) >= startOfMonth
  )

  if (financeEntries.length > 0 || profile.monthlyIncome) {
    let income = 0
    let expenses = 0

    for (const entry of financeEntries) {
      const f = entry.fields as { amount?: number }
      const amount = f.amount ?? 0
      if (entry.subcategory === 'Einnahme') {
        income += amount
      } else {
        expenses += amount
      }
    }

    lines.push('=== FINANCE (this month) ===')
    if (profile.monthlyIncome) {
      lines.push(`Monthly income reference: ${profile.monthlyIncome.toFixed(2)} ${profile.currency}`)
      const savingsRate = income > 0 ? ((income - expenses) / income * 100) : ((profile.monthlyIncome - expenses) / profile.monthlyIncome * 100)
      lines.push(`Estimated savings rate: ${savingsRate.toFixed(1)}%`)
    }
    lines.push(`Logged income this month: ${income.toFixed(2)} ${profile.currency}`)
    lines.push(`Expenses: ${expenses.toFixed(2)} ${profile.currency}`)
    lines.push(`Net: ${(income - expenses).toFixed(2)} ${profile.currency}`)
    lines.push('')
  }

  // ── Fitness ────────────────────────────────────────────────
  const fitnessEntries = recentEntries.filter((e) => e.category === 'fitness')
  if (fitnessEntries.length > 0) {
    const durations = fitnessEntries
      .map((e) => (e.fields as { duration?: number }).duration)
      .filter((v): v is number => v !== undefined)

    lines.push('=== FITNESS (last 30d) ===')
    lines.push(`Workouts logged: ${fitnessEntries.length}`)
    if (durations.length > 0) {
      lines.push(`Average workout duration: ${Math.round(average(durations))}min`)
      lines.push(`Total workout time: ${Math.round(durations.reduce((a, b) => a + b, 0) / 60)}h`)
    }
    const workoutTypes = fitnessEntries.map((e) => e.subcategory)
    const typeCounts: Record<string, number> = {}
    for (const t of workoutTypes) {
      typeCounts[t] = (typeCounts[t] ?? 0) + 1
    }
    const topTypes = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${k} (${v}x)`)
    lines.push(`Top activities: ${topTypes.join(', ')}`)
    lines.push('')
  }

  // ── Habits ─────────────────────────────────────────────────
  if (habits.length > 0) {
    lines.push('=== HABIT STREAKS ===')
    for (const habit of habits) {
      if (!habit.enabled) continue
      const cat = DEFAULT_CATEGORIES.find((c) => c.id === habit.category)
      lines.push(
        `  ${cat?.icon ?? '•'} ${habit.name}: current streak ${habit.currentStreak} days, longest ${habit.longestStreak} days`
      )
    }
    lines.push('')
  }

  // ── Goals ──────────────────────────────────────────────────
  const activeGoals = goals.filter((g) => !g.achieved)
  if (activeGoals.length > 0) {
    lines.push('=== ACTIVE GOALS ===')
    for (const goal of activeGoals) {
      const pct = goal.targetValue > 0
        ? Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100))
        : 0
      const cat = DEFAULT_CATEGORIES.find((c) => c.id === goal.category)
      lines.push(
        `  ${cat?.icon ?? '•'} ${goal.title}: ${goal.currentValue}/${goal.targetValue} ${goal.unit} (${pct}%)${goal.deadline ? ` — deadline ${formatDate(goal.deadline)}` : ''}`
      )
    }
    const achievedGoals = goals.filter((g) => g.achieved)
    if (achievedGoals.length > 0) {
      lines.push(`Achieved goals: ${achievedGoals.length} 🏆`)
    }
    lines.push('')
  }

  // ── Substances ─────────────────────────────────────────────
  const substanceEntries = recentEntries.filter((e) => e.category === 'substances')
  if (substanceEntries.length > 0) {
    const substanceCounts: Record<string, number> = {}
    for (const e of substanceEntries) {
      substanceCounts[e.subcategory] = (substanceCounts[e.subcategory] ?? 0) + 1
    }
    lines.push('=== SUBSTANCES (last 30d) ===')
    for (const [sub, count] of Object.entries(substanceCounts)) {
      lines.push(`  ${sub}: ${count}x`)
    }
    lines.push('')
  }

  // ── Last 10 entries ────────────────────────────────────────
  const last10 = [...entries]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  if (last10.length > 0) {
    lines.push('=== RECENT ENTRIES (last 10) ===')
    for (const entry of last10) {
      const cat = DEFAULT_CATEGORIES.find((c) => c.id === entry.category)
      const date = formatDate(entry.timestamp)
      const noteStr = entry.note ? ` — "${entry.note}"` : ''
      lines.push(`  [${date}] ${cat?.icon ?? ''} ${entry.category}/${entry.subcategory}${noteStr}`)
    }
  }

  return lines.join('\n')
}
