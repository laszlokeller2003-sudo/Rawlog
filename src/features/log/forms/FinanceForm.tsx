import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FinanceFields, FinanceCategoryTag, Currency } from '@/types'
import { PillSelector } from '@/components/PillSelector'
import { Input } from '@/components/Input'

interface FinanceFormProps {
  subcategory?: string
  fields: FinanceFields
  onChange: (f: FinanceFields) => void
}

const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP']
const CURRENCY_SYMBOL: Record<Currency, string> = { EUR: '€', USD: '$', GBP: '£' }

const AUSGABE_CATEGORIES: FinanceCategoryTag[] = [
  'Essen & Trinken', 'Restaurant', 'Lebensmittel', 'Transport', 'Shopping',
  'Unterhaltung', 'Gesundheit', 'Wohnen', 'Abonnements', 'Reisen',
  'Bildung', 'Sport', 'Körperpflege', 'Technik', 'Sonstiges',
]
const AUSGABE_CATEGORY_KEYS = [
  'essenTrinken', 'restaurant', 'lebensmittel', 'transport', 'shopping',
  'unterhaltung', 'gesundheit', 'wohnen', 'abonnements', 'reisen',
  'bildung', 'sport', 'koerperpflege', 'technik', 'sonstiges',
]

const PAYMENT_METHODS = ['Bar', 'Karte', 'Überweisung', 'PayPal', 'Klarna', 'Crypto', 'Sonstiges'] as const
const PAYMENT_METHOD_KEYS = ['bar', 'karte', 'ueberweisung', 'paypal', 'klarna', 'crypto', 'sonstiges']

const RECURRING_FREQ = ['täglich', 'wöchentlich', 'monatlich', 'jährlich'] as const
const RECURRING_FREQ_KEYS = ['taeglich', 'woechentlich', 'monatlich', 'jaehrlich']

const INVEST_TYPES = ['Aktien', 'ETF', 'Krypto', 'Immobilien', 'Anleihen', 'P2P', 'Sonstiges']
const INVEST_TYPE_KEYS = ['aktien', 'etf', 'krypto', 'immobilien', 'anleihen', 'p2p', 'sonstiges']

function labelMap(t: (key: string) => string, ns: string, values: readonly string[], keys: readonly string[]): Record<string, string> {
  return Object.fromEntries(values.map((v, i) => [v, t(`forms.finance.${ns}.${keys[i]}`)]))
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="input-label mb-0">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
        style={{ background: value ? 'var(--accent-red)' : 'var(--border)' }}
        role="switch"
        aria-checked={value}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
          style={{ transform: value ? 'translateX(26px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  )
}

function AmountRow({ fields, onChange }: { fields: FinanceFields; onChange: (f: FinanceFields) => void }) {
  const { t } = useTranslation()
  return (
    <div>
      <label className="input-label">{t('forms.finance.amount')}</label>
      <div className="flex gap-2 items-start">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base" style={{ color: 'var(--text-secondary)', fontFamily: 'system-ui, sans-serif' }}>
            {CURRENCY_SYMBOL[fields.currency]}
          </span>
          <input
            className="input-field pl-8"
            type="number"
            min="0"
            step="0.01"
            value={fields.amount || ''}
            onChange={(e) => onChange({ ...fields, amount: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            style={{ borderRadius: 0 }}
          />
        </div>
        <PillSelector
          options={[...CURRENCIES]}
          value={fields.currency}
          onChange={(v) => onChange({ ...fields, currency: v as Currency })}
        />
      </div>
    </div>
  )
}

function AusgabeForm({ fields, onChange }: { fields: FinanceFields; onChange: (f: FinanceFields) => void }) {
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)
  const categoryLabels = labelMap(t, 'categories', AUSGABE_CATEGORIES, AUSGABE_CATEGORY_KEYS)
  const paymentMethodLabels = labelMap(t, 'paymentMethods', PAYMENT_METHODS, PAYMENT_METHOD_KEYS)
  const recurringFreqLabels = labelMap(t, 'recurringFreq', RECURRING_FREQ, RECURRING_FREQ_KEYS)

  return (
    <div className="space-y-4">
      <AmountRow fields={fields} onChange={onChange} />

      <div>
        <label className="input-label">{t('habits.category')}</label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {AUSGABE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onChange({ ...fields, categoryTag: cat })}
              className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                border: fields.categoryTag === cat ? '1px solid var(--accent-red)' : '1px solid var(--border)',
                background: fields.categoryTag === cat ? 'var(--accent-red-dim)' : 'var(--bg-elevated)',
                color: fields.categoryTag === cat ? '#F5F5F5' : '#888888',
              }}
            >
              {categoryLabels[cat]}
            </button>
          ))}
        </div>
      </div>

      <Input
        label={t('forms.finance.merchantDescription')}
        value={fields.merchant ?? ''}
        onChange={(v) => onChange({ ...fields, merchant: v || undefined })}
        placeholder={t('forms.finance.merchantPlaceholder')}
      />

      <div>
        <label className="input-label">{t('forms.finance.paymentMethod')}</label>
        <PillSelector
          options={[...PAYMENT_METHODS]}
          labels={paymentMethodLabels}
          value={fields.paymentMethod ?? ''}
          onChange={(v) => onChange({ ...fields, paymentMethod: v as FinanceFields['paymentMethod'] })}
        />
      </div>

      <button
        type="button"
        className="btn-ghost text-xs w-full flex items-center justify-center gap-1"
        onClick={() => setShowMore(!showMore)}
      >
        <span>{showMore ? '▲' : '▼'}</span>
        <span>{showMore ? t('forms.lessDetails') : t('forms.moreDetails')}</span>
      </button>

      {showMore && (
        <>
          <div className="divider" />
          <div>
            <label className="input-label">{t('forms.finance.date')}</label>
            <input
              className="input-field"
              type="date"
              value={fields.entryDate ?? new Date().toISOString().slice(0, 10)}
              onChange={(e) => onChange({ ...fields, entryDate: e.target.value })}
              style={{ borderRadius: 0, colorScheme: 'dark' }}
            />
          </div>
          <Toggle label={t('forms.finance.recurring')} value={!!fields.recurring} onChange={(v) => onChange({ ...fields, recurring: v })} />
          {fields.recurring && (
            <div>
              <label className="input-label">{t('forms.finance.frequency')}</label>
              <PillSelector
                options={[...RECURRING_FREQ]}
                labels={recurringFreqLabels}
                value={fields.recurringFrequency ?? ''}
                onChange={(v) => onChange({ ...fields, recurringFrequency: v as FinanceFields['recurringFrequency'] })}
              />
            </div>
          )}
          <Toggle label={t('forms.finance.impulseBuy')} value={!!fields.impulseBuy} onChange={(v) => onChange({ ...fields, impulseBuy: v })} />
        </>
      )}
    </div>
  )
}

export function FinanceForm({ subcategory = 'Ausgabe', fields, onChange }: FinanceFormProps) {
  const { t } = useTranslation()
  const sub = subcategory.toLowerCase()
  const investTypeLabels = labelMap(t, 'investTypes', INVEST_TYPES, INVEST_TYPE_KEYS)

  if (sub === 'einnahme') {
    return (
      <div className="space-y-4">
        <AmountRow fields={fields} onChange={onChange} />
        <Input
          label={t('forms.finance.sourceDescription')}
          value={fields.source ?? ''}
          onChange={(v) => onChange({ ...fields, source: v || undefined })}
          placeholder={t('forms.finance.sourcePlaceholder')}
        />
        <Toggle label={t('forms.finance.recurring')} value={!!fields.recurring} onChange={(v) => onChange({ ...fields, recurring: v })} />
      </div>
    )
  }

  if (sub === 'sparen') {
    return (
      <div className="space-y-4">
        <AmountRow fields={fields} onChange={onChange} />
        <Input
          label={t('forms.finance.accountPot')}
          value={fields.account ?? ''}
          onChange={(v) => onChange({ ...fields, account: v || undefined })}
          placeholder={t('forms.finance.accountPlaceholder')}
        />
      </div>
    )
  }

  if (sub === 'investition') {
    return (
      <div className="space-y-4">
        <AmountRow fields={fields} onChange={onChange} />
        <div>
          <label className="input-label">{t('forms.finance.investType')}</label>
          <PillSelector
            options={INVEST_TYPES}
            labels={investTypeLabels}
            value={fields.investType ?? ''}
            onChange={(v) => onChange({ ...fields, investType: v as string })}
          />
        </div>
        <Input
          label={t('forms.finance.assetName')}
          value={fields.asset ?? ''}
          onChange={(v) => onChange({ ...fields, asset: v || undefined })}
          placeholder={t('forms.finance.assetPlaceholder')}
        />
      </div>
    )
  }

  if (sub === 'schulden') {
    return (
      <div className="space-y-4">
        <AmountRow fields={fields} onChange={onChange} />
        <Input
          label={t('forms.finance.toWhom')}
          value={fields.toWhom ?? ''}
          onChange={(v) => onChange({ ...fields, toWhom: v || undefined })}
          placeholder={t('forms.finance.toWhomPlaceholder')}
        />
      </div>
    )
  }

  // Default: Ausgabe
  return <AusgabeForm fields={fields} onChange={onChange} />
}
