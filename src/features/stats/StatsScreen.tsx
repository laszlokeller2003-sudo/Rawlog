import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { useHabitsStore } from '@/stores/useHabitsStore'
import { useUIStore } from '@/stores/useUIStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { DEFAULT_CATEGORIES } from '@/lib/categories'
import { formatCurrency, toDateString } from '@/lib/utils'
import type { TimeFilter, MoodFields, SleepFields, FinanceFields } from '@/types'

// ─── Tooltip Style ───────────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: { background: '#1C1C1C', border: '1px solid #242424', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#888888' },
  itemStyle: { color: '#F5F5F5' },
}

// ─── Date Range Helper ────────────────────────────────────────────────────────
function getDateRange(filter: TimeFilter): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  switch (filter) {
    case 'today': start.setHours(0, 0, 0, 0); break
    case 'week': start.setDate(start.getDate() - 7); break
    case 'month': start.setMonth(start.getMonth() - 1); break
    case '3months': start.setMonth(start.getMonth() - 3); break
    case 'year': start.setFullYear(start.getFullYear() - 1); break
    case 'all': start.setFullYear(2020); break
  }
  return { start, end }
}

// ─── Heatmap Color ────────────────────────────────────────────────────────────
function heatmapColor(count: number): string {
  if (count === 0) return '#1A1A1A'
  if (count === 1) return '#4d0808'
  if (count <= 3) return '#7a1010'
  if (count <= 6) return '#B31010'
  return '#FF2020'
}

// ─── Time Filters ─────────────────────────────────────────────────────────────
const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: '3months', label: '3M' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
]

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <span className="text-3xl">📊</span>
      <p className="text-sm" style={{ color: '#444444' }}>{message}</p>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#888888' }}>
      {title}
    </h3>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function StatsScreen() {
  const { entries, getEntriesInRange } = useEntriesStore()
  const { habits } = useHabitsStore()
  const { statsTimeFilter, setStatsTimeFilter } = useUIStore()
  const { profile } = useProfileStore()

  const { start, end } = useMemo(() => getDateRange(statsTimeFilter), [statsTimeFilter])
  const filteredEntries = useMemo(() => getEntriesInRange(start, end), [getEntriesInRange, start, end])

  // ── Summary Cards ───────────────────────────────────────────────────────────
  const totalEntries = filteredEntries.length

  const activeDays = useMemo(() => {
    const days = new Set(filteredEntries.map((e) => e.timestamp.slice(0, 10)))
    return days.size
  }, [filteredEntries])

  const bestStreak = useMemo(() => {
    if (habits.length === 0) return 0
    return Math.max(...habits.map((h) => h.longestStreak))
  }, [habits])

  const topCategory = useMemo(() => {
    if (filteredEntries.length === 0) return '—'
    const counts: Record<string, number> = {}
    filteredEntries.forEach((e) => {
      counts[e.category] = (counts[e.category] ?? 0) + 1
    })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (!top) return '—'
    const cat = DEFAULT_CATEGORIES.find((c) => c.id === top[0])
    return cat ? cat.icon : top[0]
  }, [filteredEntries])

  const avgMood = useMemo(() => {
    const moodEntries = filteredEntries.filter((e) => e.category === 'mood')
    if (moodEntries.length === 0) return null
    const intensities = moodEntries
      .map((e) => (e.fields as MoodFields).intensity)
      .filter((v): v is number => v !== undefined)
    if (intensities.length === 0) return null
    return (intensities.reduce((a, b) => a + b, 0) / intensities.length).toFixed(1)
  }, [filteredEntries])

  const totalFinance = useMemo(() => {
    const financeEntries = filteredEntries.filter((e) => e.category === 'finance')
    if (financeEntries.length === 0) return null
    return financeEntries.reduce((sum, e) => {
      const amt = (e.fields as FinanceFields).amount ?? 0
      return sum + Math.abs(amt)
    }, 0)
  }, [filteredEntries])

  // ── 365-Day Heatmap ─────────────────────────────────────────────────────────
  const heatmapData = useMemo(() => {
    const countsByDate: Record<string, number> = {}
    entries.forEach((e) => {
      const d = e.timestamp.slice(0, 10)
      countsByDate[d] = (countsByDate[d] ?? 0) + 1
    })

    const days: Array<{ date: string; count: number; col: number; row: number }> = []
    const today = new Date()
    // Start from 364 days ago
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 364)
    // Align to Sunday
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)

    let col = 0
    let row = 0
    const current = new Date(startDate)
    while (current <= today || days.length < 365) {
      const dateStr = toDateString(current)
      days.push({ date: dateStr, count: countsByDate[dateStr] ?? 0, col, row })
      row++
      if (row === 7) {
        row = 0
        col++
      }
      current.setDate(current.getDate() + 1)
      if (days.length >= 371) break
    }
    return days
  }, [entries])

  const totalCols = useMemo(() => {
    if (heatmapData.length === 0) return 0
    return Math.max(...heatmapData.map((d) => d.col)) + 1
  }, [heatmapData])

  // Month labels for heatmap
  const monthLabels = useMemo(() => {
    const labels: Array<{ label: string; col: number }> = []
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    let lastMonth = -1
    heatmapData.forEach((d) => {
      const month = new Date(d.date + 'T00:00:00').getMonth()
      if (month !== lastMonth && d.row === 0) {
        labels.push({ label: months[month], col: d.col })
        lastMonth = month
      }
    })
    return labels
  }, [heatmapData])

  // ── Last 30 Days Bar Chart ──────────────────────────────────────────────────
  const last30DaysData = useMemo(() => {
    const countsByDate: Record<string, number> = {}
    entries.forEach((e) => {
      const d = e.timestamp.slice(0, 10)
      countsByDate[d] = (countsByDate[d] ?? 0) + 1
    })
    const result: Array<{ day: string; count: number }> = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = toDateString(d)
      result.push({ day: String(d.getDate()), count: countsByDate[dateStr] ?? 0 })
    }
    return result
  }, [entries])

  // ── Category Breakdown ──────────────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredEntries.forEach((e) => {
      counts[e.category] = (counts[e.category] ?? 0) + 1
    })
    const total = filteredEntries.length
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([catId, count]) => {
        const cat = DEFAULT_CATEGORIES.find((c) => c.id === catId)
        return {
          id: catId,
          name: cat?.name ?? catId,
          icon: cat?.icon ?? '📌',
          color: cat?.color ?? '#888888',
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }
      })
  }, [filteredEntries])

  // ── Mood Trend ──────────────────────────────────────────────────────────────
  const moodTrendData = useMemo(() => {
    const moodEntries = filteredEntries.filter((e) => e.category === 'mood')
    if (moodEntries.length === 0) return []
    const byDate: Record<string, number[]> = {}
    moodEntries.forEach((e) => {
      const d = e.timestamp.slice(0, 10)
      const intensity = (e.fields as MoodFields).intensity
      if (intensity !== undefined) {
        if (!byDate[d]) byDate[d] = []
        byDate[d].push(intensity)
      }
    })
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date: date.slice(5),
        avg: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)),
      }))
  }, [filteredEntries])

  // ── Sleep Quality Trend ─────────────────────────────────────────────────────
  const sleepTrendData = useMemo(() => {
    const sleepEntries = filteredEntries.filter((e) => e.category === 'sleep')
    if (sleepEntries.length === 0) return []
    const byDate: Record<string, number[]> = {}
    sleepEntries.forEach((e) => {
      const d = e.timestamp.slice(0, 10)
      const quality = (e.fields as SleepFields).quality
      if (quality !== undefined) {
        if (!byDate[d]) byDate[d] = []
        byDate[d].push(quality)
      }
    })
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({
        date: date.slice(5),
        avg: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)),
      }))
  }, [filteredEntries])

  const CELL_SIZE = 10
  const CELL_GAP = 2

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#080808' }}>
      {/* Time Filter Bar */}
      <div
        className="sticky top-0 z-10 flex overflow-x-auto gap-2 px-4 py-3"
        style={{ background: '#080808', borderBottom: '1px solid #1A1A1A' }}
      >
        {TIME_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatsTimeFilter(f.value)}
            className="flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              background: statsTimeFilter === f.value ? '#FF2020' : '#1C1C1C',
              color: statsTimeFilter === f.value ? '#F5F5F5' : '#888888',
              border: `1px solid ${statsTimeFilter === f.value ? '#FF2020' : '#242424'}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 pb-24 space-y-6">
        {/* Summary Cards */}
        <div>
          <SectionHeader title="Overview" />
          <div className="grid grid-cols-3 gap-2">
            <SummaryCard value={String(totalEntries)} label="Entries" />
            <SummaryCard value={String(activeDays)} label="Active Days" />
            <SummaryCard value={String(bestStreak)} label="Best Streak" />
            <SummaryCard value={topCategory} label="Top Category" />
            <SummaryCard value={avgMood !== null ? avgMood : '—'} label="Avg Mood" />
            <SummaryCard
              value={totalFinance !== null ? formatCurrency(totalFinance, profile.currency) : '—'}
              label="Finance"
              small={totalFinance !== null}
            />
          </div>
        </div>

        {/* Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
        >
          <SectionHeader title="365-Day Activity" />
          <div
            className="rounded-lg p-3 overflow-x-auto"
            style={{ background: '#1C1C1C', border: '1px solid #242424' }}
          >
            <div style={{ position: 'relative', paddingTop: 18 }}>
              {/* Month labels */}
              <div style={{ position: 'absolute', top: 0, left: 0, display: 'flex' }}>
                {monthLabels.map((m) => (
                  <div
                    key={`${m.label}-${m.col}`}
                    style={{
                      position: 'absolute',
                      left: m.col * (CELL_SIZE + CELL_GAP),
                      fontSize: 9,
                      color: '#888888',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${totalCols}, ${CELL_SIZE}px)`,
                  gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
                  gap: CELL_GAP,
                  gridAutoFlow: 'column',
                }}
              >
                {heatmapData.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.count} entries`}
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      borderRadius: 2,
                      background: heatmapColor(d.count),
                    }}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-1 mt-2 justify-end">
                <span style={{ fontSize: 9, color: '#444444' }}>Less</span>
                {[0, 1, 3, 5, 7].map((v) => (
                  <div
                    key={v}
                    style={{ width: 8, height: 8, borderRadius: 1, background: heatmapColor(v) }}
                  />
                ))}
                <span style={{ fontSize: 9, color: '#444444' }}>More</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Entries per Day */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <SectionHeader title="Last 30 Days" />
          <div
            className="rounded-lg p-3"
            style={{ background: '#1C1C1C', border: '1px solid #242424' }}
          >
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={last30DaysData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#888888', fontSize: 9 }}
                  axisLine={{ stroke: '#242424' }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: '#888888', fontSize: 10 }}
                  axisLine={{ stroke: '#242424' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#FF2020" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.15 }}
        >
          <SectionHeader title="Category Breakdown" />
          <div
            className="rounded-lg p-3 space-y-3"
            style={{ background: '#1C1C1C', border: '1px solid #242424' }}
          >
            {categoryBreakdown.length === 0 ? (
              <EmptyState message="No entries in this period" />
            ) : (
              categoryBreakdown.map((cat) => (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cat.icon}</span>
                      <span className="text-xs" style={{ color: '#F5F5F5' }}>{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: '#888888' }}>{cat.count}</span>
                      <span className="text-xs font-mono" style={{ color: '#444444' }}>{cat.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#242424' }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${cat.percentage}%`, background: cat.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Mood Trend */}
        {moodTrendData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.2 }}
          >
            <SectionHeader title="Mood Trend" />
            <div
              className="rounded-lg p-3"
              style={{ background: '#1C1C1C', border: '1px solid #242424' }}
            >
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={moodTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#888888', fontSize: 9 }}
                    axisLine={{ stroke: '#242424' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[1, 10]}
                    tick={{ fill: '#888888', fontSize: 10 }}
                    axisLine={{ stroke: '#242424' }}
                    tickLine={false}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke="#EAB308"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, fill: '#EAB308' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Sleep Quality Trend */}
        {sleepTrendData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.25 }}
          >
            <SectionHeader title="Sleep Quality" />
            <div
              className="rounded-lg p-3"
              style={{ background: '#1C1C1C', border: '1px solid #242424' }}
            >
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={sleepTrendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#888888', fontSize: 9 }}
                    axisLine={{ stroke: '#242424' }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[1, 10]}
                    tick={{ fill: '#888888', fontSize: 10 }}
                    axisLine={{ stroke: '#242424' }}
                    tickLine={false}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="avg"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, fill: '#3B82F6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Habit Streaks */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.3 }}
        >
          <SectionHeader title="Habit Streaks" />
          <div
            className="rounded-lg divide-y"
            style={{ background: '#1C1C1C', border: '1px solid #242424', borderColor: '#242424' }}
          >
            {habits.length === 0 ? (
              <div className="p-4">
                <EmptyState message="No habits tracked yet" />
              </div>
            ) : (
              habits
                .filter((h) => h.enabled)
                .map((habit) => {
                  const cat = DEFAULT_CATEGORIES.find((c) => c.id === habit.category)
                  const progress = habit.longestStreak > 0
                    ? (habit.currentStreak / habit.longestStreak) * 100
                    : 0
                  return (
                    <div key={habit.id} className="px-3 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{cat?.icon ?? '⚡'}</span>
                          <span className="text-sm" style={{ color: '#F5F5F5' }}>{habit.name}</span>
                          {habit.currentStreak > 3 && <span className="text-xs">🔥</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold" style={{ color: '#FF2020' }}>
                            {habit.currentStreak}
                          </span>
                          <span className="text-xs" style={{ color: '#444444' }}>
                            / {habit.longestStreak}
                          </span>
                        </div>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: '#242424' }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progress}%`,
                            background: cat?.color ?? '#FF2020',
                          }}
                        />
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ─── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({
  value,
  label,
  small = false,
}: {
  value: string
  label: string
  small?: boolean
}) {
  return (
    <div
      className="rounded-lg p-3 text-center"
      style={{ background: '#1C1C1C', border: '1px solid #242424' }}
    >
      <div
        className={`font-mono font-bold ${small ? 'text-base' : 'text-xl'} truncate`}
        style={{ color: '#F5F5F5' }}
      >
        {value}
      </div>
      <div
        className="text-xs uppercase tracking-wider mt-1 truncate"
        style={{ color: '#444444' }}
      >
        {label}
      </div>
    </div>
  )
}
