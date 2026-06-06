import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { toDateString } from '@/lib/utils'
import type { WorkFields } from '@/types'

const tooltipStyle = {
  contentStyle: { background: '#1C1C1C', border: '1px solid #242424', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#888888' },
  itemStyle: { color: '#F5F5F5' },
}

const INDIGO_PALETTE = [
  '#6366F1', '#818CF8', '#4F46E5', '#A5B4FC', '#3730A3', '#C7D2FE', '#312E81',
]

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#888888' }}>
      {title}
    </h3>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-lg p-4 ${className}`}
      style={{ background: '#1C1C1C', border: '1px solid #242424' }}
    >
      {children}
    </div>
  )
}

function EmptyState({ icon, message }: { icon?: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 gap-2">
      <span className="text-2xl">{icon ?? '📊'}</span>
      <p className="text-sm" style={{ color: '#444444' }}>{message}</p>
    </div>
  )
}

export function ProductivityDashboard() {
  const { entries } = useEntriesStore()
  const workEntries = useMemo(() => entries.filter((e) => e.category === 'work'), [entries])

  // Deep Work hours (last 30 days)
  const deepWorkData = useMemo(() => {
    const result: Array<{ date: string; hours: number }> = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = toDateString(d)
      const dayDeepWork = workEntries.filter(
        (e) => e.subcategory === 'Deep Work' && e.timestamp.startsWith(dateStr)
      )
      const totalMinutes = dayDeepWork.reduce(
        (sum, e) => sum + ((e.fields as WorkFields).duration ?? 0),
        0
      )
      result.push({
        date: String(d.getDate()),
        hours: parseFloat((totalMinutes / 60).toFixed(1)),
      })
    }
    return result
  }, [workEntries])

  // Focus Score Trend
  const focusScoreData = useMemo(() => {
    const withFocus = workEntries.filter(
      (e) => (e.fields as WorkFields).focusScore !== undefined
    )
    if (withFocus.length === 0) return []
    const byDate: Record<string, number[]> = {}
    withFocus.forEach((e) => {
      const d = e.timestamp.slice(0, 10)
      const score = (e.fields as WorkFields).focusScore!
      if (!byDate[d]) byDate[d] = []
      byDate[d].push(score)
    })
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, scores]) => ({
        date: date.slice(5),
        score: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)),
      }))
  }, [workEntries])

  // Work vs Procrastination
  const deepWorkCount = useMemo(
    () => workEntries.filter((e) => e.subcategory === 'Deep Work').length,
    [workEntries]
  )
  const procrastinatedCount = useMemo(
    () => workEntries.filter((e) => e.subcategory === 'Procrastinated').length,
    [workEntries]
  )
  const totalWP = deepWorkCount + procrastinatedCount
  const deepWorkPct = totalWP > 0 ? Math.round((deepWorkCount / totalWP) * 100) : 0

  // Flow State this month
  const thisMonthStart = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const flowStateCount = useMemo(
    () =>
      workEntries.filter(
        (e) => e.subcategory === 'Flow State' && new Date(e.timestamp) >= thisMonthStart
      ).length,
    [workEntries, thisMonthStart]
  )

  // Work Distribution by Subcategory
  const workDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    workEntries.forEach((e) => {
      counts[e.subcategory] = (counts[e.subcategory] ?? 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: INDIGO_PALETTE[i % INDIGO_PALETTE.length] }))
  }, [workEntries])

  // Peak Productivity Time (by hour)
  const hourData = useMemo(() => {
    const hourCounts: Record<number, number> = {}
    workEntries.forEach((e) => {
      const hour = new Date(e.timestamp).getHours()
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1
    })
    const maxCount = Math.max(0, ...Object.values(hourCounts))
    return Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${h.toString().padStart(2, '0')}`,
      count: hourCounts[h] ?? 0,
      isPeak: hourCounts[h] === maxCount && maxCount > 0,
    }))
  }, [workEntries])

  const peakHour = useMemo(() => {
    if (workEntries.length === 0) return null
    const max = hourData.reduce((a, b) => (b.count > a.count ? b : a))
    return max.count > 0 ? max : null
  }, [hourData, workEntries])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Deep Work Hours */}
      <div>
        <SectionHeader title="Deep Work Hours (30d)" />
        <Card>
          {workEntries.filter((e) => e.subcategory === 'Deep Work').length === 0 ? (
            <EmptyState icon="⚡" message="No Deep Work sessions logged yet" />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={deepWorkData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#888888', fontSize: 9 }}
                  axisLine={{ stroke: '#242424' }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: '#888888', fontSize: 10 }}
                  axisLine={{ stroke: '#242424' }}
                  tickLine={false}
                />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v}h`, 'Deep Work']} />
                <Bar dataKey="hours" fill="#6366F1" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Focus Score Trend */}
      {focusScoreData.length > 0 && (
        <div>
          <SectionHeader title="Focus Score Trend" />
          <Card>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={focusScoreData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#888888', fontSize: 9 }}
                  axisLine={{ stroke: '#242424' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[0, 10]}
                  tick={{ fill: '#888888', fontSize: 10 }}
                  axisLine={{ stroke: '#242424' }}
                  tickLine={false}
                />
                <Tooltip {...tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: '#6366F1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Work vs Procrastination */}
      <div>
        <SectionHeader title="Work vs Procrastination" />
        <Card className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-lg p-3 text-center"
              style={{ background: '#181818', border: '1px solid #6366F1' + '44' }}
            >
              <div className="font-mono text-3xl font-bold" style={{ color: '#6366F1' }}>
                {deepWorkCount}
              </div>
              <div className="text-xs mt-1" style={{ color: '#888888' }}>Deep Work</div>
            </div>
            <div
              className="rounded-lg p-3 text-center"
              style={{ background: '#181818', border: '1px solid #FF2020' + '44' }}
            >
              <div className="font-mono text-3xl font-bold" style={{ color: '#FF2020' }}>
                {procrastinatedCount}
              </div>
              <div className="text-xs mt-1" style={{ color: '#888888' }}>Procrastinated</div>
            </div>
          </div>
          {totalWP > 0 && (
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs" style={{ color: '#6366F1' }}>Focus</span>
                <span className="text-xs font-mono" style={{ color: '#6366F1' }}>{deepWorkPct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden flex" style={{ background: '#242424' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${deepWorkPct}%`, background: '#6366F1' }}
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Flow State */}
      <div>
        <SectionHeader title="Flow State" />
        <Card className="text-center">
          <div className="font-mono text-5xl font-bold mb-2" style={{ color: '#6366F1' }}>
            {flowStateCount}
          </div>
          <div className="text-sm" style={{ color: '#888888' }}>
            flow states this month
          </div>
          {flowStateCount === 0 && (
            <div className="text-xs mt-2" style={{ color: '#444444' }}>
              Log 'Flow State' work sessions to track this
            </div>
          )}
        </Card>
      </div>

      {/* Work Distribution */}
      <div>
        <SectionHeader title="Work Distribution" />
        <Card>
          {workDistribution.length === 0 ? (
            <EmptyState icon="⚡" message="No work entries yet" />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={workDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {workDistribution.map((entry, i) => (
                      <Cell key={entry.name} fill={INDIGO_PALETTE[i % INDIGO_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 w-full">
                {workDistribution.map((entry, i) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-sm flex-shrink-0"
                      style={{ background: INDIGO_PALETTE[i % INDIGO_PALETTE.length] }}
                    />
                    <span className="text-xs truncate" style={{ color: '#888888' }}>
                      {entry.name}
                    </span>
                    <span className="text-xs font-mono ml-auto" style={{ color: '#F5F5F5' }}>
                      {entry.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Peak Productivity Time */}
      <div>
        <SectionHeader title="Peak Productivity Time" />
        <Card>
          {workEntries.length === 0 ? (
            <EmptyState icon="⏰" message="No work entries to analyze yet" />
          ) : (
            <>
              {peakHour && (
                <div className="text-center mb-3">
                  <span className="text-xs" style={{ color: '#444444' }}>Peak hour: </span>
                  <span className="font-mono font-bold" style={{ color: '#6366F1' }}>
                    {peakHour.label}:00 – {peakHour.label}:59
                  </span>
                </div>
              )}
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={hourData.filter((h) => h.count > 0 || (h.hour >= 6 && h.hour <= 22))}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: '#888888', fontSize: 9 }}
                    axisLine={{ stroke: '#242424' }}
                    tickLine={false}
                    interval={2}
                  />
                  <YAxis
                    tick={{ fill: '#888888', fontSize: 10 }}
                    axisLine={{ stroke: '#242424' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    labelFormatter={(label) => `${label}:00`}
                  />
                  <Bar
                    dataKey="count"
                    radius={[2, 2, 0, 0]}
                    name="Sessions"
                  >
                    {hourData
                      .filter((h) => h.count > 0 || (h.hour >= 6 && h.hour <= 22))
                      .map((h) => (
                        <Cell
                          key={h.hour}
                          fill={h.isPeak ? '#FF2020' : '#6366F1'}
                        />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </Card>
      </div>
    </motion.div>
  )
}
