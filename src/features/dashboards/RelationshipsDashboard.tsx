import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ShieldCheck } from 'lucide-react'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { toDateString } from '@/lib/utils'
import type { SocialFields, IntimacyFields } from '@/types'

const tooltipStyle = {
  contentStyle: { background: '#1C1C1C', border: '1px solid #242424', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#888888' },
  itemStyle: { color: '#F5F5F5' },
}

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

// Heatmap for social entries
function heatmapColor(count: number): string {
  if (count === 0) return '#1A1A1A'
  if (count === 1) return '#003d40'
  if (count <= 3) return '#006b72'
  if (count <= 6) return '#059aaa'
  return '#06B6D4'
}

export function RelationshipsDashboard() {
  const { entries } = useEntriesStore()

  const socialEntries = useMemo(() => entries.filter((e) => e.category === 'social'), [entries])
  const intimacyEntries = useMemo(() => entries.filter((e) => e.category === 'intimacy'), [entries])

  // This month social
  const thisMonthStart = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const thisMonthSocial = useMemo(
    () => socialEntries.filter((e) => new Date(e.timestamp) >= thisMonthStart),
    [socialEntries, thisMonthStart]
  )

  const thisMonthIntimacy = useMemo(
    () => intimacyEntries.filter((e) => new Date(e.timestamp) >= thisMonthStart),
    [intimacyEntries, thisMonthStart]
  )

  // Time with People
  const timeWithPeople = useMemo(() => {
    const counts: Record<string, number> = {}
    socialEntries.forEach((e) => {
      const who = (e.fields as SocialFields).who
      if (who && who.trim()) {
        counts[who.trim()] = (counts[who.trim()] ?? 0) + 1
      }
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }))
  }, [socialEntries])

  // Energy Balance
  const energyBalance = useMemo(() => {
    const counts = { drained: 0, neutral: 0, energized: 0 }
    socialEntries.forEach((e) => {
      const ea = (e.fields as SocialFields).energyAfter
      if (ea && ea in counts) counts[ea as keyof typeof counts]++
    })
    return [
      { name: 'Drained', value: counts.drained, color: '#FF2020' },
      { name: 'Neutral', value: counts.neutral, color: '#888888' },
      { name: 'Energized', value: counts.energized, color: '#22C55E' },
    ].filter((d) => d.value > 0)
  }, [socialEntries])

  // Social Heatmap (90 days)
  const heatmapData = useMemo(() => {
    const countsByDate: Record<string, number> = {}
    socialEntries.forEach((e) => {
      const d = e.timestamp.slice(0, 10)
      countsByDate[d] = (countsByDate[d] ?? 0) + 1
    })

    const days: Array<{ date: string; count: number; col: number; row: number }> = []
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 89)
    const dayOfWeek = startDate.getDay()
    startDate.setDate(startDate.getDate() - dayOfWeek)

    let col = 0
    let row = 0
    const current = new Date(startDate)
    let limit = 0
    while (current <= today && limit < 105) {
      const dateStr = toDateString(current)
      days.push({ date: dateStr, count: countsByDate[dateStr] ?? 0, col, row })
      row++
      if (row === 7) { row = 0; col++ }
      current.setDate(current.getDate() + 1)
      limit++
    }
    return days
  }, [socialEntries])

  const totalHeatmapCols = useMemo(() => {
    if (heatmapData.length === 0) return 0
    return Math.max(...heatmapData.map((d) => d.col)) + 1
  }, [heatmapData])

  // Social Balance
  const aloneTimeCount = useMemo(
    () => thisMonthSocial.filter((e) => e.subcategory === 'Alone time').length,
    [thisMonthSocial]
  )
  const totalSocialCount = thisMonthSocial.length
  const socialWithOthers = totalSocialCount - aloneTimeCount

  // Intimacy Overview
  const avgIntimacyRating = useMemo(() => {
    const ratings = thisMonthIntimacy
      .map((e) => (e.fields as IntimacyFields).rating)
      .filter((r): r is number => r !== undefined)
    if (ratings.length === 0) return null
    return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
  }, [thisMonthIntimacy])

  const CELL_SIZE = 9
  const CELL_GAP = 2

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Time with People */}
      <div>
        <SectionHeader title="Time with People" />
        <Card>
          {timeWithPeople.length === 0 ? (
            <EmptyState icon="👥" message="Log social entries with 'who' field to see this" />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(120, timeWithPeople.length * 32)}>
              <BarChart
                data={timeWithPeople}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis
                  type="number"
                  tick={{ fill: '#888888', fontSize: 10 }}
                  axisLine={{ stroke: '#242424' }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#888888', fontSize: 10 }}
                  axisLine={{ stroke: '#242424' }}
                  tickLine={false}
                  width={70}
                />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#06B6D4" radius={[0, 2, 2, 0]} name="Times" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Energy Balance */}
      <div>
        <SectionHeader title="Energy After Socializing" />
        <Card>
          {energyBalance.length === 0 ? (
            <EmptyState icon="⚡" message="No energy data from social entries yet" />
          ) : (
            <div className="flex items-center justify-around">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={energyBalance} cx="50%" cy="50%" outerRadius={65} dataKey="value">
                    {energyBalance.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {energyBalance.map((e) => (
                  <div key={e.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: e.color }} />
                    <span className="text-xs" style={{ color: '#888888' }}>{e.name}</span>
                    <span className="text-xs font-mono font-bold" style={{ color: '#F5F5F5' }}>
                      {e.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Social Heatmap (90 days) */}
      <div>
        <SectionHeader title="Social Activity (90d)" />
        <Card>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${totalHeatmapCols}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
              gap: CELL_GAP,
              gridAutoFlow: 'column',
            }}
          >
            {heatmapData.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} social entries`}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  borderRadius: 2,
                  background: heatmapColor(d.count),
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-1 mt-2 justify-end">
            <span style={{ fontSize: 9, color: '#444444' }}>Less</span>
            {[0, 1, 3, 5, 7].map((v) => (
              <div key={v} style={{ width: 7, height: 7, borderRadius: 1, background: heatmapColor(v) }} />
            ))}
            <span style={{ fontSize: 9, color: '#444444' }}>More</span>
          </div>
        </Card>
      </div>

      {/* Social Balance */}
      <div>
        <SectionHeader title="Social Balance This Month" />
        <div className="grid grid-cols-2 gap-2">
          <Card className="text-center p-3">
            <div className="font-mono text-2xl font-bold" style={{ color: '#06B6D4' }}>
              {socialWithOthers}
            </div>
            <div className="text-xs mt-1" style={{ color: '#444444' }}>Social Events</div>
          </Card>
          <Card className="text-center p-3">
            <div className="font-mono text-2xl font-bold" style={{ color: '#A855F7' }}>
              {aloneTimeCount}
            </div>
            <div className="text-xs mt-1" style={{ color: '#444444' }}>Alone Time</div>
          </Card>
        </div>
        {totalSocialCount > 0 && (
          <div className="mt-2">
            <div className="flex justify-between mb-1">
              <span className="text-xs" style={{ color: '#888888' }}>Social</span>
              <span className="text-xs" style={{ color: '#888888' }}>Alone</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden flex" style={{ background: '#242424' }}>
              <div
                className="h-full"
                style={{
                  width: `${totalSocialCount > 0 ? (socialWithOthers / totalSocialCount) * 100 : 0}%`,
                  background: '#06B6D4',
                }}
              />
              <div
                className="h-full"
                style={{
                  width: `${totalSocialCount > 0 ? (aloneTimeCount / totalSocialCount) * 100 : 0}%`,
                  background: '#A855F7',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Intimacy Overview */}
      <div>
        <SectionHeader title="Intimacy Overview" />
        <Card className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="font-mono text-2xl font-bold" style={{ color: '#FF2020' }}>
                {thisMonthIntimacy.length}
              </div>
              <div className="text-xs mt-1" style={{ color: '#444444' }}>Entries this month</div>
            </div>
            <div className="text-center">
              <div className="font-mono text-2xl font-bold" style={{ color: '#EAB308' }}>
                {avgIntimacyRating !== null ? avgIntimacyRating : '—'}
              </div>
              <div className="text-xs mt-1" style={{ color: '#444444' }}>Avg Rating</div>
            </div>
          </div>
          <div
            className="flex items-center gap-2 rounded-md px-3 py-2"
            style={{ background: '#181818', border: '1px solid #242424' }}
          >
            <ShieldCheck size={14} style={{ color: '#22C55E', flexShrink: 0 }} />
            <p className="text-xs" style={{ color: '#444444' }}>
              This data is private and stays on your device
            </p>
          </div>
        </Card>
      </div>
    </motion.div>
  )
}
