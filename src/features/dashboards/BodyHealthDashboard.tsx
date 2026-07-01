import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  YAxis as RechartsYAxis,
} from 'recharts'
import { Plus, Edit2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { generateId, toDateString } from '@/lib/utils'
import type { HealthFields, SleepFields, MoodFields, FitnessFields } from '@/types'

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

export function BodyHealthDashboard() {
  const { t } = useTranslation()
  const { entries } = useEntriesStore()
  const { profile, bodyMetrics, addBodyMetric, updateBodyMetric } = useProfileStore()

  const [showWeightForm, setShowWeightForm] = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [showMeasurementsForm, setShowMeasurementsForm] = useState(false)
  const [measurements, setMeasurements] = useState({ chest: '', waist: '', hips: '', arms: '' })

  // ── Weight Chart ────────────────────────────────────────────────────────────
  const weightData = useMemo(
    () =>
      bodyMetrics
        .filter((m) => m.weight !== undefined)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((m) => ({ date: m.date.slice(5), weight: m.weight! })),
    [bodyMetrics]
  )

  const latestMetric = bodyMetrics[0]

  function handleAddWeight() {
    const w = parseFloat(weightInput)
    if (isNaN(w) || w <= 0) return
    addBodyMetric({ date: toDateString(), weight: w })
    setWeightInput('')
    setShowWeightForm(false)
  }

  function handleUpdateMeasurements() {
    const m = {
      chest: parseFloat(measurements.chest) || undefined,
      waist: parseFloat(measurements.waist) || undefined,
      hips: parseFloat(measurements.hips) || undefined,
      arms: parseFloat(measurements.arms) || undefined,
    }
    if (latestMetric) {
      updateBodyMetric(latestMetric.id, {
        measurements: { ...latestMetric.measurements, ...m },
      })
    } else {
      addBodyMetric({ date: toDateString(), measurements: m })
    }
    setShowMeasurementsForm(false)
  }

  // ── Health Entries ──────────────────────────────────────────────────────────
  const healthEntries = useMemo(() => entries.filter((e) => e.category === 'health'), [entries])
  const sleepEntries = useMemo(() => entries.filter((e) => e.category === 'sleep'), [entries])
  const moodEntries = useMemo(() => entries.filter((e) => e.category === 'mood'), [entries])
  const fitnessEntries = useMemo(() => entries.filter((e) => e.category === 'fitness'), [entries])

  // ── Energy Trend ────────────────────────────────────────────────────────────
  const energyEntries = useMemo(
    () =>
      healthEntries.filter((e) =>
        ['High energy', 'Low energy'].includes(e.subcategory)
      ),
    [healthEntries]
  )

  // ── Symptoms ────────────────────────────────────────────────────────────────
  const symptomEntries = useMemo(
    () =>
      healthEntries
        .filter((e) =>
          ['Sick', 'Headache', 'Pain', 'Symptom', 'Doctor visit'].includes(e.subcategory)
        )
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, 10),
    [healthEntries]
  )

  // ── Sleep vs Mood (last 30 days) ────────────────────────────────────────────
  const sleepMoodData = useMemo(() => {
    const byDate: Record<string, { sleepQ: number[]; moodI: number[] }> = {}
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    sleepEntries.forEach((e) => {
      if (new Date(e.timestamp) < thirtyDaysAgo) return
      const d = e.timestamp.slice(0, 10)
      const quality = (e.fields as SleepFields).quality
      if (quality !== undefined) {
        if (!byDate[d]) byDate[d] = { sleepQ: [], moodI: [] }
        byDate[d].sleepQ.push(quality)
      }
    })

    moodEntries.forEach((e) => {
      if (new Date(e.timestamp) < thirtyDaysAgo) return
      const d = e.timestamp.slice(0, 10)
      const intensity = (e.fields as MoodFields).intensity
      if (intensity !== undefined) {
        if (!byDate[d]) byDate[d] = { sleepQ: [], moodI: [] }
        byDate[d].moodI.push(intensity)
      }
    })

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { sleepQ, moodI }]) => ({
        date: date.slice(5),
        sleep: sleepQ.length > 0 ? parseFloat((sleepQ.reduce((a, b) => a + b, 0) / sleepQ.length).toFixed(1)) : null,
        mood: moodI.length > 0 ? parseFloat((moodI.reduce((a, b) => a + b, 0) / moodI.length).toFixed(1)) : null,
      }))
  }, [sleepEntries, moodEntries])

  // ── Workout Consistency (last 12 weeks) ─────────────────────────────────────
  const workoutData = useMemo(() => {
    const weeks: Array<{ week: string; count: number }> = []
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 7)
      const count = fitnessEntries.filter((e) => {
        const t = new Date(e.timestamp)
        return t >= weekStart && t < weekEnd
      }).length
      weeks.push({
        week: `W${weekStart.toLocaleDateString(profile.language === 'de' ? 'de' : 'en', { month: 'short', day: 'numeric' })}`,
        count,
      })
    }
    return weeks
  }, [fitnessEntries])

  function severityColor(severity?: number): string {
    if (!severity) return '#444444'
    if (severity <= 3) return '#22C55E'
    if (severity <= 6) return '#EAB308'
    return '#FF2020'
  }

  const latestMeasurements = latestMetric?.measurements

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Weight Chart */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader title={t('dashboards.bodyHealth.weightKg')} />
          <button
            onClick={() => setShowWeightForm((v) => !v)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
            style={{ background: '#181818', color: '#FF2020', border: '1px solid #242424' }}
          >
            <Plus size={12} />
            {t('dashboards.bodyHealth.add')}
          </button>
        </div>

        {showWeightForm && (
          <div className="mb-3 flex gap-2">
            <input
              type="number"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder={t('dashboards.bodyHealth.weightPlaceholder') as string}
              className="flex-1 rounded-md px-3 py-2 text-sm outline-none"
              style={{ background: '#181818', border: '1px solid #242424', color: '#F5F5F5' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#FF2020')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#242424')}
            />
            <button
              onClick={handleAddWeight}
              className="px-3 py-2 rounded-md text-sm font-medium"
              style={{ background: '#FF2020', color: '#F5F5F5' }}
            >
              {t('dashboards.bodyHealth.save')}
            </button>
          </div>
        )}

        <Card>
          {weightData.length === 0 ? (
            <EmptyState icon="⚖️" message={t('dashboards.bodyHealth.addFirstWeight')} />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weightData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#888888', fontSize: 9 }}
                  axisLine={{ stroke: '#242424' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fill: '#888888', fontSize: 10 }}
                  axisLine={{ stroke: '#242424' }}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v} kg`, t('dashboards.bodyHealth.weight')]} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#EC4899"
                  strokeWidth={2}
                  dot={{ fill: '#EC4899', r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Body Measurements */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader title={t('dashboards.bodyHealth.measurementsCm')} />
          <button
            onClick={() => setShowMeasurementsForm((v) => !v)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md"
            style={{ background: '#181818', color: '#FF2020', border: '1px solid #242424' }}
          >
            <Edit2 size={12} />
            {t('dashboards.bodyHealth.update')}
          </button>
        </div>

        {showMeasurementsForm && (
          <Card className="mb-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              {(['chest', 'waist', 'hips', 'arms'] as const).map((key) => (
                <div key={key}>
                  <label className="text-xs block mb-1 capitalize" style={{ color: '#888888' }}>
                    {t(`dashboards.bodyHealth.${key}`)}
                  </label>
                  <input
                    type="number"
                    value={measurements[key]}
                    onChange={(e) => setMeasurements((m) => ({ ...m, [key]: e.target.value }))}
                    placeholder="cm"
                    className="w-full rounded-md px-2 py-1.5 text-sm outline-none"
                    style={{ background: '#181818', border: '1px solid #242424', color: '#F5F5F5' }}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleUpdateMeasurements}
              className="w-full py-2 rounded-md text-sm font-medium"
              style={{ background: '#FF2020', color: '#F5F5F5' }}
            >
              {t('dashboards.bodyHealth.saveMeasurements')}
            </button>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-2">
          {(['chest', 'waist', 'hips', 'arms'] as const).map((key) => (
            <Card key={key} className="text-center p-3">
              <div className="text-xs capitalize mb-1" style={{ color: '#444444' }}>{t(`dashboards.bodyHealth.${key}`)}</div>
              <div className="font-mono text-lg font-bold" style={{ color: '#F5F5F5' }}>
                {latestMeasurements?.[key] ? `${latestMeasurements[key]}cm` : '—'}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Energy Trend */}
      {energyEntries.length > 0 && (
        <div>
          <SectionHeader title={t('dashboards.bodyHealth.energyLog')} />
          <Card className="space-y-2">
            <div className="flex gap-3">
              <div className="flex-1 text-center p-2 rounded-md" style={{ background: '#181818' }}>
                <div className="font-mono text-2xl font-bold" style={{ color: '#22C55E' }}>
                  {energyEntries.filter((e) => e.subcategory === 'High energy').length}
                </div>
                <div className="text-xs mt-1" style={{ color: '#444444' }}>{t('dashboards.bodyHealth.highEnergy')}</div>
              </div>
              <div className="flex-1 text-center p-2 rounded-md" style={{ background: '#181818' }}>
                <div className="font-mono text-2xl font-bold" style={{ color: '#FF2020' }}>
                  {energyEntries.filter((e) => e.subcategory === 'Low energy').length}
                </div>
                <div className="text-xs mt-1" style={{ color: '#444444' }}>{t('dashboards.bodyHealth.lowEnergy')}</div>
              </div>
            </div>
            <div className="text-xs text-center" style={{ color: '#444444' }}>
              {t('dashboards.bodyHealth.totalLogged', { count: energyEntries.length })}
            </div>
          </Card>
        </div>
      )}

      {/* Symptoms Timeline */}
      <div>
        <SectionHeader title={t('dashboards.bodyHealth.symptomsTimeline')} />
        <Card className="p-0">
          {symptomEntries.length === 0 ? (
            <div className="p-4">
              <EmptyState icon="🏥" message={t('dashboards.bodyHealth.noSymptoms')} />
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#242424' }}>
              {symptomEntries.map((entry) => {
                const fields = entry.fields as HealthFields
                return (
                  <div key={entry.id} className="flex items-start justify-between px-4 py-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: '#F5F5F5' }}>
                          {entry.subcategory}
                        </span>
                        {fields.severity !== undefined && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded-md"
                            style={{
                              background: severityColor(fields.severity) + '22',
                              color: severityColor(fields.severity),
                            }}
                          >
                            {fields.severity}/10
                          </span>
                        )}
                      </div>
                      {entry.note && (
                        <div className="text-xs mt-0.5" style={{ color: '#444444' }}>
                          {entry.note}
                        </div>
                      )}
                    </div>
                    <div className="text-xs ml-3" style={{ color: '#444444' }}>
                      {entry.timestamp.slice(0, 10)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Sleep vs Mood Correlation */}
      {sleepMoodData.length > 0 && (
        <div>
          <SectionHeader title={t('dashboards.bodyHealth.sleepVsMood')} />
          <Card>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={sleepMoodData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#888888', fontSize: 9 }}
                  axisLine={{ stroke: '#242424' }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 10]}
                  tick={{ fill: '#3B82F6', fontSize: 9 }}
                  axisLine={{ stroke: '#242424' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 10]}
                  tick={{ fill: '#EAB308', fontSize: 9 }}
                  axisLine={{ stroke: '#242424' }}
                  tickLine={false}
                />
                <Tooltip {...tooltipStyle} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="sleep"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  name={t('dashboards.bodyHealth.sleep') as string}
                  connectNulls
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="mood"
                  stroke="#EAB308"
                  strokeWidth={2}
                  dot={false}
                  name={t('dashboards.bodyHealth.mood') as string}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5" style={{ background: '#3B82F6' }} />
                <span className="text-xs" style={{ color: '#888888' }}>{t('dashboards.bodyHealth.sleep')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5" style={{ background: '#EAB308' }} />
                <span className="text-xs" style={{ color: '#888888' }}>{t('dashboards.bodyHealth.mood')}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Workout Consistency */}
      <div>
        <SectionHeader title={t('dashboards.bodyHealth.workoutConsistency')} />
        <Card>
          {fitnessEntries.length === 0 ? (
            <EmptyState icon="💪" message={t('dashboards.bodyHealth.noWorkouts')} />
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={workoutData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#888888', fontSize: 8 }}
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
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#22C55E" radius={[2, 2, 0, 0]} name={t('dashboards.bodyHealth.workouts') as string} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </motion.div>
  )
}
