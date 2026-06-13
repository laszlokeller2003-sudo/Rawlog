import { useMemo } from 'react'
import { motion, Variants } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { Flame, ChevronRight } from 'lucide-react'
import { useProfileStore } from '@/stores/useProfileStore'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { useHabitsStore } from '@/stores/useHabitsStore'
import { useGoalsStore } from '@/stores/useGoalsStore'
import { useChatStore } from '@/stores/useChatStore'
import { useUIStore } from '@/stores/useUIStore'
import { useScoreStore } from '@/stores/useScoreStore'
import { DEFAULT_CATEGORIES, getCategoryById } from '@/lib/categories'
import { cn, toDateString } from '@/lib/utils'
import type { CategoryId, MoodFields } from '@/types'

// ─── Animation Variants ───────────────────────────────────────────────────────

const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
}

// ─── Greeting Logic ───────────────────────────────────────────────────────────

function useGreeting(name: string, language: string): string {
  const { t } = useTranslation()
  const hour = new Date().getHours()
  let key: string
  if (hour < 12) key = 'greeting.morning'
  else if (hour < 17) key = 'greeting.afternoon'
  else if (hour < 21) key = 'greeting.evening'
  else key = 'greeting.night'

  const greetingText = t(key)
  return name ? `${greetingText}, ${name.split(' ')[0]}` : greetingText
}

// ─── Streak Calculation ───────────────────────────────────────────────────────

function useCurrentStreak(entries: ReturnType<typeof useEntriesStore.getState>['entries']): number {
  return useMemo(() => {
    const today = toDateString()
    let streak = 0
    let checkDate = today

    for (let i = 0; i < 365; i++) {
      const hasEntry = entries.some((e) => e.timestamp.startsWith(checkDate))
      if (hasEntry) {
        streak++
        const d = new Date(checkDate)
        d.setDate(d.getDate() - 1)
        checkDate = d.toISOString().split('T')[0]
      } else {
        // Allow gap only for today (entries not logged yet)
        if (i === 0) {
          const d = new Date(checkDate)
          d.setDate(d.getDate() - 1)
          checkDate = d.toISOString().split('T')[0]
          continue
        }
        break
      }
    }

    return streak
  }, [entries])
}

// ─── Score Card ───────────────────────────────────────────────────────────────

function ScoreCard({
  value,
  label,
  color,
}: {
  value: string | number
  label: string
  color?: string
}) {
  return (
    <div className="card flex flex-col gap-1 p-3">
      <span
        className="font-mono font-bold text-2xl leading-none"
        style={{ color: color ?? '#F5F5F5' }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: '#444444',
          fontFamily: "'Space Grotesk', sans-serif",
        }}
      >
        {label}
      </span>
    </div>
  )
}

// ─── Quick Log Item ───────────────────────────────────────────────────────────

function QuickLogItem({
  icon,
  label,
  color,
  onClick,
}: {
  icon: string
  label: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className="quick-log-item"
      style={{
        background: `${color}12`,
        borderColor: `${color}25`,
        transition: 'all 150ms ease',
      }}
      onClick={onClick}
    >
      <span className="quick-log-emoji" style={{ fontSize: '28px' }}>{icon}</span>
      <span className="quick-log-label" style={{ color: '#F5F5F5' }}>{label}</span>
    </button>
  )
}

// ─── Habit Card ───────────────────────────────────────────────────────────────

function HabitCard({ habitId }: { habitId: string }) {
  const { t } = useTranslation()
  const { habits, isCompleted, checkInHabit, uncheckinHabit } = useHabitsStore()
  const habit = habits.find((h) => h.id === habitId)

  if (!habit) return null

  const today = toDateString()
  const done = isCompleted(habitId, today)
  const cat = getCategoryById(habit.category)

  return (
    <div
      className="flex-shrink-0 flex flex-col gap-2 p-3 rounded-lg border"
      style={{
        background: '#1C1C1C',
        borderColor: done ? cat.color : '#242424',
        width: 140,
        transition: 'border-color 150ms',
      }}
    >
      <div className="flex items-start justify-between">
        <span style={{ fontSize: 11, fontWeight: 600, color: '#888888', lineHeight: 1.3, flex: 1 }}>
          {habit.name}
        </span>
        <button
          type="button"
          onClick={() => (done ? uncheckinHabit(habitId) : checkInHabit(habitId))}
          className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ml-2"
          style={{
            borderColor: done ? cat.color : '#242424',
            background: done ? cat.color : 'transparent',
            transition: 'all 150ms',
          }}
        >
          {done && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4 L3.5 6.5 L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
      {habit.currentStreak > 0 && (
        <div className="flex items-center gap-1">
          <Flame size={10} color="#FF2020" />
          <span
            className="font-mono"
            style={{ fontSize: 11, color: '#FF2020', fontWeight: 600 }}
          >
            {habit.currentStreak}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Feed Entry Row ───────────────────────────────────────────────────────────

function FeedEntry({
  categoryId,
  subcategory,
  timestamp,
  note,
}: {
  categoryId: CategoryId
  subcategory: string
  timestamp: string
  note?: string
}) {
  const cat = getCategoryById(categoryId)
  const time = format(new Date(timestamp), 'HH:mm')

  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#1A1A1A] last:border-0">
      {/* Color circle */}
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
        style={{ background: `${cat.color}20`, border: `1px solid ${cat.color}40` }}
      >
        <span style={{ fontSize: 14 }}>{cat.icon}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#F5F5F5',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {subcategory}
          </span>
          {note && (
            <span
              style={{ fontSize: 12, color: '#444444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              · {note}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: '#888888' }}>
          {cat.name}
        </span>
      </div>

      {/* Time */}
      <span
        className="font-mono flex-shrink-0"
        style={{ fontSize: 11, color: '#444444' }}
      >
        {time}
      </span>
    </div>
  )
}

// ─── Score Band Helper ──────────────────────────────────────────────────────────

function getScoreBand(score: number | null, language: string) {
  if (score === null || isNaN(score)) return { label: '—', emoji: '—', color: 'var(--text-muted)' }
  const isDe = language === 'de'
  if (score < 40) return { label: isDe ? 'Kritisch' : 'Critical', emoji: '🔴', color: '#FF2020' }
  if (score < 60) return { label: isDe ? 'Ausbaufähig' : 'Needs work', emoji: '🟡', color: '#EAB308' }
  if (score < 75) return { label: isDe ? 'Gut' : 'Good', emoji: '🟢', color: '#22C55E' }
  if (score < 90) return { label: isDe ? 'Stark' : 'Strong', emoji: '💪', color: '#22C55E' }
  return { label: isDe ? 'Außergewöhnlich' : 'Exceptional', emoji: '🔥', color: '#FF2020' }
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

export function HomeScreen() {
  const { t } = useTranslation()
  const { profile } = useProfileStore()
  const { entries, getTodayEntries } = useEntriesStore()
  const { habits, habitLogs } = useHabitsStore()
  const { insights, setPendingQuestion } = useChatStore()
  const { openEntrySheet, setActiveTab, setInsightsActiveTab } = useUIStore()
  const scoreStore = useScoreStore()

  const todayStr = useMemo(() => toDateString(), [])
  const goals = useGoalsStore((s) => s.goals)

  const { overall, categories, isFrozen, frozenDate } = useMemo(() => {
    return scoreStore.calculateAllScoresForDate(todayStr)
  }, [scoreStore, todayStr, entries, habits, goals, profile])

  const yesterdayStr = useMemo(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  }, [])

  const yesterdayOverall = useMemo(() => {
    const histItem = scoreStore.history.find((h) => h.date === yesterdayStr)
    if (histItem) return histItem.overall_score
    return scoreStore.calculateAllScoresForDate(yesterdayStr).overall
  }, [scoreStore, yesterdayStr, entries, habits, goals, profile])

  const diff = useMemo(() => {
    if (overall === null || yesterdayOverall === null) return 0
    return overall - yesterdayOverall
  }, [overall, yesterdayOverall])

  const last7DaysScores = useMemo(() => {
    const scores: number[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const dStr = d.toISOString().split('T')[0]
      const histItem = scoreStore.history.find((h) => h.date === dStr)
      if (histItem && histItem.overall_score !== null) {
        scores.push(histItem.overall_score)
      } else {
        const calculated = scoreStore.calculateAllScoresForDate(dStr).overall
        scores.push(calculated ?? 50)
      }
    }
    return scores
  }, [scoreStore, entries, habits, goals, profile])

  const todayEntries = useMemo(() => getTodayEntries(), [getTodayEntries, entries])
  const greeting = useGreeting(profile.name, profile.language)
  const streak = useCurrentStreak(entries)

  // Habits for today
  const today = toDateString()
  const dayOfWeek = new Date().getDay()
  const todayHabits = useMemo(() => {
    return habits.filter((h) => {
      if (!h.enabled) return false
      if (h.frequency === 'daily') return true
      if (h.frequency === 'weekly') return true
      if (Array.isArray(h.frequency)) return h.frequency.includes(dayOfWeek)
      return false
    })
  }, [habits, dayOfWeek])

  const completedHabitsCount = useMemo(() => {
    return todayHabits.filter((h) =>
      habitLogs.some((l) => l.habitId === h.id && l.date === today && l.completed)
    ).length
  }, [todayHabits, habitLogs, today])

  // Avg mood today
  const avgMood = useMemo(() => {
    const moodEntries = todayEntries.filter((e) => e.category === 'mood')
    if (moodEntries.length === 0) return null
    const intensities = moodEntries
      .map((e) => (e.fields as MoodFields).intensity)
      .filter((v): v is number => typeof v === 'number')
    if (intensities.length === 0) return null
    return Math.round(intensities.reduce((a, b) => a + b, 0) / intensities.length)
  }, [todayEntries])

  // Quick log categories
  const quickLogCategories = useMemo(() => {
    return DEFAULT_CATEGORIES
  }, [])

  // Recent feed entries (last 8)
  const recentEntries = useMemo(() => entries.slice(0, 8), [entries])

  return (
    <div className="screen">
      <div className="px-4 pb-4">
        <motion.div
        variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-5"
        >
          {/* ─ Header ─────────────────────────────────────────────── */}
          <motion.div variants={fadeUp} className="flex items-start justify-between pt-5">
            <div className="flex-1">
              <h1
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#F5F5F5',
                  lineHeight: 1.2,
                }}
              >
                {greeting}
              </h1>
              <p
                className="font-mono"
                style={{ fontSize: 11, color: '#444444', marginTop: 4 }}
              >
                {format(new Date(), 'EEEE, d MMMM yyyy')}
              </p>
            </div>

            {/* Streak pill */}
            {streak > 0 && (
              <div className="streak-pill">
                <Flame size={12} />
                <span>{streak}</span>
                <span style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,32,32,0.7)' }}>
                  {t('home.streak')}
                </span>
              </div>
            )}
          </motion.div>

          {/* ─ Score Cards ────────────────────────────────────────── */}
          <motion.div variants={fadeUp} className="flex flex-col gap-3">
            {/* LIFE SCORE card */}
            <button
              type="button"
              className="w-full text-left card flex flex-col p-4 relative overflow-hidden transition-all duration-300 animate-glow"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                boxShadow: diff > 0 ? '0 0 20px rgba(255, 32, 32, 0.2)' : 'none',
                borderRadius: '16px',
              }}
              onClick={() => {
                setPendingQuestion(
                  profile.language === 'de'
                    ? `Erkläre mir, warum mein Life Score heute bei ${overall !== null ? overall : '—'} liegt.`
                    : `Explain why my Life Score is at ${overall !== null ? overall : '—'} today.`
                )
                setInsightsActiveTab('chat')
                setActiveTab('insights')
              }}
            >
              <div className="flex justify-between items-start w-full">
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-muted)',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    LIFE SCORE
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-heading font-bold text-4xl text-[#F5F5F5]">
                      {overall !== null ? overall : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary font-medium">
                    <span>{getScoreBand(overall, profile.language).emoji} {getScoreBand(overall, profile.language).label}</span>
                    <span className={cn('font-mono', diff > 0 ? 'text-green-500' : diff < 0 ? 'text-accent-red' : 'text-text-muted')}>
                      {diff > 0 ? '↑ +' : diff < 0 ? '↓ ' : '→ +'}{diff} {profile.language === 'de' ? 'heute' : 'today'}
                    </span>
                  </div>
                </div>

                {/* Sparkline chart */}
                <div className="w-24 h-12 flex-shrink-0 flex items-center justify-center">
                  <svg width="100%" height="100%" viewBox="0 0 100 40" style={{ overflow: 'visible' }}>
                    <polyline
                      fill="none"
                      stroke="var(--accent-red)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={last7DaysScores.map((score, idx) => `${idx * 16.6},${35 - (score / 100) * 30}`).join(' ')}
                    />
                  </svg>
                </div>
              </div>

              {/* Freeze badge if no entries today */}
              {isFrozen && frozenDate && (
                <div className="mt-2 pt-2 border-t border-border-subtle text-[10px] text-text-muted">
                  {profile.language === 'de'
                    ? `Score vom ${format(new Date(frozenDate), 'dd.MM.yyyy')} · Log heute um ihn zu aktualisieren`
                    : `Score from ${format(new Date(frozenDate), 'dd/MM/yyyy')} · Log today to update it`}
                </div>
              )}
            </button>

            {/* Category row */}
            <div className="grid grid-cols-5 gap-1.5 mt-1">
              {(['fitness', 'sleep', 'finance', 'work', 'social'] as const).map((catId) => {
                const cat = getCategoryById(catId)
                const detail = categories[catId]
                const scoreVal = detail ? detail.score : null
                const band = getScoreBand(scoreVal, profile.language)

                return (
                  <button
                    key={catId}
                    type="button"
                    className="flex flex-col items-center justify-between p-2 rounded-xl bg-bg-card border border-border-subtle hover:border-border transition-colors text-center"
                    onClick={() => {
                      setPendingQuestion(
                        profile.language === 'de'
                          ? `Analysiere meinen ${cat.name} Score für heute.`
                          : `Analyze my ${cat.name} score for today.`
                      )
                      setInsightsActiveTab('chat')
                      setActiveTab('insights')
                    }}
                  >
                    <span className="text-[10px] font-heading font-semibold text-text-muted truncate w-full">
                      {cat.name.split(' ')[0]}
                    </span>
                    <span className="font-mono text-sm font-bold text-text-primary my-0.5">
                      {scoreVal !== null ? scoreVal : '—'}
                    </span>
                    <span className="text-xs leading-none">{scoreVal !== null ? band.emoji : '—'}</span>
                  </button>
                )
              })}
            </div>
          </motion.div>

          {/* ─ Quick Log ──────────────────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <div className="section-header">
              <span className="section-title">{t('home.quickLog')}</span>
            </div>
            <div className="quick-log-grid">
              {quickLogCategories.map((cat) => (
                <QuickLogItem
                  key={cat.id}
                  icon={cat.icon}
                  color={cat.color}
                  label={
                    cat.id === 'substances'
                      ? 'Subst.'
                      : cat.id === 'intimacy'
                      ? 'Intimacy'
                      : cat.id === 'nutrition'
                      ? 'Food'
                      : cat.id === 'finance'
                      ? 'Money'
                      : cat.id === 'social'
                      ? 'Social'
                      : cat.name.split(' ')[0]
                  }
                  onClick={() => openEntrySheet(cat.id)}
                />
              ))}
            </div>
          </motion.div>

          {/* ─ Today's Habits ─────────────────────────────────────── */}
          {todayHabits.length > 0 && (
            <motion.div variants={fadeUp}>
              <div className="section-header">
                <span className="section-title">{t('home.todaysHabits')}</span>
                <span style={{ fontSize: 11, color: '#888888' }}>
                  {completedHabitsCount}/{todayHabits.length} {t('home.done')}
                </span>
              </div>
              <div
                className="flex gap-2 overflow-x-auto pb-1"
                style={{ scrollbarWidth: 'none' }}
              >
                {todayHabits.map((habit) => (
                  <HabitCard key={habit.id} habitId={habit.id} />
                ))}
              </div>
            </motion.div>
          )}

          {/* ─ PA Insight Card ────────────────────────────────────── */}
          {insights.length > 0 && (
            <motion.div variants={fadeUp}>
              <button
                type="button"
                className="w-full text-left card flex items-center gap-3"
                style={{
                  borderLeft: '3px solid #FF2020',
                  borderRadius: '0 12px 12px 0',
                  paddingLeft: 13,
                }}
                onClick={() => setActiveTab('insights')}
              >
                <span style={{ fontSize: 20 }}>🤖</span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#F5F5F5',
                    fontFamily: "'Space Grotesk', sans-serif",
                    flex: 1,
                  }}
                >
                  {t('home.paInsight')}
                </span>
                <ChevronRight size={16} color="#444444" />
              </button>
            </motion.div>
          )}

          {/* ─ Recent Activity Feed ───────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <div className="section-header">
              <span className="section-title">{t('home.recentActivity')}</span>
              {entries.length > 8 && (
                <button
                  type="button"
                  className="btn-ghost py-0 px-0"
                  style={{ fontSize: 12, color: '#FF2020' }}
                  onClick={() => setActiveTab('log')}
                >
                  {t('home.seeAll')}
                </button>
              )}
            </div>

            {recentEntries.length === 0 ? (
              <div
                className="card flex flex-col items-center gap-3 py-8"
                style={{ textAlign: 'center' }}
              >
                <span style={{ fontSize: 36 }}>🤖</span>
                <p style={{ fontSize: 13, color: '#444444', lineHeight: 1.5 }}>
                  {t('home.noEntries')}
                </p>
              </div>
            ) : (
              <div className="card p-0 overflow-hidden" style={{ padding: '0 16px' }}>
                {recentEntries.map((entry) => (
                  <FeedEntry
                    key={entry.id}
                    categoryId={entry.category}
                    subcategory={entry.subcategory}
                    timestamp={entry.timestamp}
                    note={entry.note}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default HomeScreen
