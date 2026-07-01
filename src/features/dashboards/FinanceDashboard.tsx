import React, { useMemo, useState } from 'react'
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
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { formatCurrency, toDateString } from '@/lib/utils'
import type { FinanceFields } from '@/types'

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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-2">
      <span className="text-3xl">💰</span>
      <p className="text-sm" style={{ color: '#444444' }}>{message}</p>
    </div>
  )
}

const PIE_COLORS: Record<string, string> = {
  'Essen & Trinken': '#F97316',
  'Restaurant': '#FB923C',
  'Lebensmittel': '#FBBF24',
  'Transport': '#3B82F6',
  'Shopping': '#06B6D4',
  'Unterhaltung': '#A855F7',
  'Gesundheit': '#EC4899',
  'Wohnen': '#14B8A6',
  'Abonnements': '#8B5CF6',
  'Reisen': '#0EA5E9',
  'Bildung': '#22C55E',
  'Sport': '#10B981',
  'Körperpflege': '#F472B6',
  'Technik': '#6366F1',
  'Sonstiges': '#888888',
  // legacy
  food: '#F97316',
  transport: '#3B82F6',
  entertainment: '#A855F7',
  health: '#EC4899',
  clothing: '#06B6D4',
  tech: '#6366F1',
  other: '#888888',
}

export function FinanceDashboard() {
  const { t } = useTranslation()
  const { entries } = useEntriesStore()
  const { profile } = useProfileStore()
  const currency = profile.currency

  const [assets, setAssets] = useState<string>('')
  const [debts, setDebts] = useState<string>('')

  const financeEntries = useMemo(
    () => entries.filter((e) => e.category === 'finance'),
    [entries]
  )

  // This month boundaries
  const thisMonthStart = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const lastMonthStart = useMemo(() => {
    const d = new Date(thisMonthStart)
    d.setMonth(d.getMonth() - 1)
    return d
  }, [thisMonthStart])

  const thisMonthEntries = useMemo(
    () => financeEntries.filter((e) => new Date(e.timestamp) >= thisMonthStart),
    [financeEntries, thisMonthStart]
  )

  const lastMonthEntries = useMemo(
    () =>
      financeEntries.filter(
        (e) => new Date(e.timestamp) >= lastMonthStart && new Date(e.timestamp) < thisMonthStart
      ),
    [financeEntries, lastMonthStart, thisMonthStart]
  )

  // Income / Expenses this month
  const { income, expenses } = useMemo(() => {
    let inc = 0
    let exp = 0
    thisMonthEntries.forEach((e) => {
      const fields = e.fields as FinanceFields
      const amt = Math.abs(fields.amount ?? 0)
      if (e.subcategory === 'Einnahme') inc += amt
      else exp += amt
    })
    return { income: inc, expenses: exp }
  }, [thisMonthEntries])

  const net = income - expenses
  const savingsRate = income > 0 ? Math.max(0, Math.round((net / income) * 100)) : 0

  // Last month total
  const lastMonthTotal = useMemo(
    () =>
      lastMonthEntries
        .filter((e) => e.subcategory !== 'Einnahme')
        .reduce((sum, e) => sum + Math.abs((e.fields as FinanceFields).amount ?? 0), 0),
    [lastMonthEntries]
  )

  const thisMonthTotal = expenses
  const monthChange =
    lastMonthTotal > 0
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
      : 0

  // Last 6 months income vs expenses
  const last6MonthsData = useMemo(() => {
    const months: Array<{ label: string; income: number; expenses: number }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setDate(1)
      d.setMonth(d.getMonth() - i)
      d.setHours(0, 0, 0, 0)
      const nextD = new Date(d)
      nextD.setMonth(nextD.getMonth() + 1)
      const monthEntries = financeEntries.filter((e) => {
        const t = new Date(e.timestamp)
        return t >= d && t < nextD
      })
      let inc = 0
      let exp = 0
      monthEntries.forEach((e) => {
        const fields = e.fields as FinanceFields
        const amt = Math.abs(fields.amount ?? 0)
        if (e.subcategory === 'Einnahme') inc += amt
        else exp += amt
      })
      months.push({
        label: d.toLocaleDateString(profile.language === 'de' ? 'de' : 'en', { month: 'short' }),
        income: parseFloat(inc.toFixed(2)),
        expenses: parseFloat(exp.toFixed(2)),
      })
    }
    return months
  }, [financeEntries])

  // Spending by category tag (this month)
  const spendingByTag = useMemo(() => {
    const counts: Record<string, number> = {}
    thisMonthEntries
      .filter((e) => e.subcategory !== 'Einnahme')
      .forEach((e) => {
        const fields = e.fields as FinanceFields
        const tag = fields.categoryTag ?? 'other'
        counts[tag] = (counts[tag] ?? 0) + Math.abs(fields.amount ?? 0)
      })
    return Object.entries(counts).map(([tag, amount]) => ({
      name: tag.charAt(0).toUpperCase() + tag.slice(1),
      value: parseFloat(amount.toFixed(2)),
      color: PIE_COLORS[tag] ?? '#888888',
    }))
  }, [thisMonthEntries])

  // Top 5 expenses this month
  const topExpenses = useMemo(
    () =>
      thisMonthEntries
        .filter((e) => e.subcategory !== 'Einnahme')
        .sort(
          (a, b) =>
            Math.abs((b.fields as FinanceFields).amount ?? 0) -
            Math.abs((a.fields as FinanceFields).amount ?? 0)
        )
        .slice(0, 5),
    [thisMonthEntries]
  )

  // Subscriptions
  const subscriptions = useMemo(
    () => financeEntries.filter((e) => (e.fields as FinanceFields).recurring === true),
    [financeEntries]
  )
  const subscriptionTotal = subscriptions.reduce(
    (sum, e) => sum + Math.abs((e.fields as FinanceFields).amount ?? 0),
    0
  )

  // 14-day daily spend vs budget
  const daily14Data = useMemo(() => {
    const days: Array<{ label: string; spend: number }> = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const daySpend = financeEntries
        .filter((e) => e.subcategory !== 'Einnahme' && e.timestamp.startsWith(dateStr))
        .reduce((sum, e) => sum + Math.abs((e.fields as FinanceFields).amount ?? 0), 0)
      days.push({ label: d.getDate().toString(), spend: parseFloat(daySpend.toFixed(2)) })
    }
    return days
  }, [financeEntries])

  // Impulse buy stats this month
  const impulseBuys = useMemo(() => {
    const items = thisMonthEntries.filter((e) => (e.fields as FinanceFields).impulseBuy === true)
    const total = items.reduce((sum, e) => sum + Math.abs((e.fields as FinanceFields).amount ?? 0), 0)
    return { count: items.length, total }
  }, [thisMonthEntries])

  const netWorth =
    (parseFloat(assets) || 0) - (parseFloat(debts) || 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* This Month Summary */}
      <div>
        <SectionHeader title={t('dashboards.financeD.thisMonth')} />
        <Card>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#444444' }}>
                {t('dashboards.financeD.income')}
              </div>
              <div className="font-mono font-bold text-lg" style={{ color: '#22C55E' }}>
                {formatCurrency(income, currency)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#444444' }}>
                {t('dashboards.financeD.expenses')}
              </div>
              <div className="font-mono font-bold text-lg" style={{ color: '#FF2020' }}>
                {formatCurrency(expenses, currency)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#444444' }}>
                {t('dashboards.financeD.net')}
              </div>
              <div
                className="font-mono font-bold text-lg"
                style={{ color: net >= 0 ? '#22C55E' : '#FF2020' }}
              >
                {formatCurrency(net, currency)}
              </div>
            </div>
          </div>

          {/* Savings Rate */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs" style={{ color: '#888888' }}>{t('dashboards.financeD.savingsRate')}</span>
              <span className="text-xs font-mono" style={{ color: '#22C55E' }}>{savingsRate}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#242424' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${savingsRate}%`, background: '#22C55E' }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Income vs Expenses Chart */}
      <div>
        <SectionHeader title={t('dashboards.financeD.incomeVsExpenses')} />
        <Card>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={last6MonthsData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#888888', fontSize: 11 }}
                axisLine={{ stroke: '#242424' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#888888', fontSize: 10 }}
                axisLine={{ stroke: '#242424' }}
                tickLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip {...tooltipStyle} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#888888' }}
              />
              <Bar dataKey="income" fill="#22C55E" radius={[2, 2, 0, 0]} name={t('dashboards.financeD.income') as string} />
              <Bar dataKey="expenses" fill="#FF2020" radius={[2, 2, 0, 0]} name={t('dashboards.financeD.expenses') as string} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* 14-Day Daily Spend vs Budget */}
      <div>
        <SectionHeader title={profile.dailyBudget ? t('dashboards.financeD.dailySpendBudget', { amount: formatCurrency(profile.dailyBudget, currency) }) : t('dashboards.financeD.dailySpend14')} />
        <Card>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={daily14Data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
              <XAxis dataKey="label" tick={{ fill: '#888888', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888888', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v: any) => formatCurrency(v, currency)} />
              <Bar dataKey="spend" name={t('dashboards.financeD.expenses') as string} radius={[2, 2, 0, 0]}>
                {daily14Data.map((d, i) => (
                  <Cell key={i} fill={profile.dailyBudget && d.spend > profile.dailyBudget ? '#FF2020' : '#22C55E'} />
                ))}
              </Bar>
              {profile.dailyBudget && (
                <ReferenceLine y={profile.dailyBudget} stroke="#EAB308" strokeDasharray="4 2" label={{ value: t('dashboards.financeD.budget') as string, fill: '#EAB308', fontSize: 10 }} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Impulse Buys */}
      {impulseBuys.count > 0 && (
        <div>
          <SectionHeader title={t('dashboards.financeD.impulseBuysThisMonth')} />
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#444444' }}>{t('dashboards.financeD.count')}</div>
                <div className="font-mono font-bold text-2xl" style={{ color: '#FF2020' }}>{impulseBuys.count}</div>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#444444' }}>{t('dashboards.financeD.total')}</div>
                <div className="font-mono font-bold text-2xl" style={{ color: '#FF2020' }}>{formatCurrency(impulseBuys.total, currency)}</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Spending by Category Pie */}
      {spendingByTag.length > 0 && (
        <div>
          <SectionHeader title={t('dashboards.financeD.spendingBreakdown')} />
          <Card>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={spendingByTag}
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${Math.round((percent as number) * 100)}%`
                  }
                  labelLine={{ stroke: '#444444' }}
                >
                  {spendingByTag.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value: any) => formatCurrency(value, currency)}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Top Expenses */}
      <div>
        <SectionHeader title={t('dashboards.financeD.topExpensesThisMonth')} />
        <Card className="p-0">
          {topExpenses.length === 0 ? (
            <div className="p-4">
              <EmptyState message={t('dashboards.financeD.noExpensesThisMonth')} />
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#242424' }}>
              {topExpenses.map((entry) => {
                const fields = entry.fields as FinanceFields
                return (
                  <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <div className="text-sm" style={{ color: '#F5F5F5' }}>
                        {entry.subcategory}
                      </div>
                      <div className="text-xs" style={{ color: '#444444' }}>
                        {entry.note ?? fields.categoryTag ?? ''}
                        {' · '}
                        {entry.timestamp.slice(0, 10)}
                      </div>
                    </div>
                    <div className="font-mono text-sm font-bold" style={{ color: '#FF2020' }}>
                      {formatCurrency(Math.abs(fields.amount ?? 0), currency)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Monthly Comparison */}
      <div>
        <SectionHeader title={t('dashboards.financeD.monthlyComparison')} />
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs mb-1" style={{ color: '#444444' }}>{t('dashboards.financeD.vsLastMonth')}</div>
              <div className="flex items-center gap-2">
                {monthChange <= 0 ? (
                  <TrendingDown size={16} style={{ color: '#22C55E' }} />
                ) : (
                  <TrendingUp size={16} style={{ color: '#FF2020' }} />
                )}
                <span
                  className="font-mono text-xl font-bold"
                  style={{ color: monthChange <= 0 ? '#22C55E' : '#FF2020' }}
                >
                  {monthChange > 0 ? '+' : ''}{monthChange}%
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs mb-1" style={{ color: '#444444' }}>{t('dashboards.financeD.thisMonth')}</div>
              <div className="font-mono text-sm font-bold" style={{ color: '#F5F5F5' }}>
                {formatCurrency(thisMonthTotal, currency)}
              </div>
              <div className="text-xs" style={{ color: '#444444' }}>
                {t('dashboards.financeD.last')}: {formatCurrency(lastMonthTotal, currency)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Net Worth Tracker */}
      <div>
        <SectionHeader title={t('dashboards.financeD.netWorthTracker')} />
        <Card className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: '#888888' }}>
                {t('dashboards.financeD.assets')} ({currency})
              </label>
              <input
                type="number"
                value={assets}
                onChange={(e) => setAssets(e.target.value)}
                placeholder="0"
                className="w-full rounded-md px-3 py-2 text-sm font-mono outline-none transition-all"
                style={{
                  background: '#181818',
                  border: '1px solid #242424',
                  color: '#F5F5F5',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#FF2020')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#242424')}
              />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: '#888888' }}>
                {t('dashboards.financeD.debts')} ({currency})
              </label>
              <input
                type="number"
                value={debts}
                onChange={(e) => setDebts(e.target.value)}
                placeholder="0"
                className="w-full rounded-md px-3 py-2 text-sm font-mono outline-none transition-all"
                style={{
                  background: '#181818',
                  border: '1px solid #242424',
                  color: '#F5F5F5',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#FF2020')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#242424')}
              />
            </div>
          </div>
          <div className="text-center pt-2" style={{ borderTop: '1px solid #242424' }}>
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: '#444444' }}>
              {t('dashboards.financeD.netWorth')}
            </div>
            <div
              className="font-mono text-3xl font-bold"
              style={{ color: netWorth >= 0 ? '#22C55E' : '#FF2020' }}
            >
              {formatCurrency(netWorth, currency)}
            </div>
          </div>
        </Card>
      </div>

      {/* Subscriptions */}
      <div>
        <SectionHeader title={t('dashboards.financeD.recurringSubscriptions')} />
        <Card className="p-0">
          {subscriptions.length === 0 ? (
            <div className="p-4">
              <EmptyState message={t('dashboards.financeD.noRecurringFound')} />
            </div>
          ) : (
            <>
              <div className="divide-y" style={{ borderColor: '#242424' }}>
                {subscriptions.map((entry) => {
                  const fields = entry.fields as FinanceFields
                  return (
                    <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <div className="text-sm" style={{ color: '#F5F5F5' }}>
                          {entry.note ?? entry.subcategory}
                        </div>
                        <div className="text-xs capitalize" style={{ color: '#444444' }}>
                          {fields.paymentMethod ?? t('dashboards.financeD.cardFallback')}
                        </div>
                      </div>
                      <div className="font-mono text-sm" style={{ color: '#EAB308' }}>
                        {formatCurrency(Math.abs(fields.amount ?? 0), currency)}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ borderTop: '1px solid #242424' }}
              >
                <span className="text-sm font-semibold" style={{ color: '#888888' }}>
                  {t('dashboards.financeD.monthlyTotal')}
                </span>
                <span className="font-mono text-sm font-bold" style={{ color: '#FF2020' }}>
                  {formatCurrency(subscriptionTotal, currency)}
                </span>
              </div>
            </>
          )}
        </Card>
      </div>
    </motion.div>
  )
}
