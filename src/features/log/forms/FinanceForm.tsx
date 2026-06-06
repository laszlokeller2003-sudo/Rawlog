import { useState } from 'react'
import type { FinanceFields, FinanceCategoryTag, Currency } from '@/types'
import { PillSelector } from '@/components/PillSelector'

interface FinanceFormProps {
  fields: FinanceFields
  onChange: (f: FinanceFields) => void
}

const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP']

const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
}

const CATEGORY_TAGS: FinanceCategoryTag[] = [
  'food', 'transport', 'entertainment', 'health', 'clothing', 'tech', 'other',
]

const PAYMENT_METHODS = ['cash', 'card', 'transfer'] as const

export function FinanceForm({ fields, onChange }: FinanceFormProps) {
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="space-y-4">
      {/* Quick: Amount + Currency */}
      <div>
        <label className="input-label">Amount</label>
        <div className="flex gap-2 items-start">
          <div className="relative flex-1">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-base font-mono"
              style={{ color: 'var(--text-secondary)' }}
            >
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

      {/* Expand toggle */}
      <button
        type="button"
        className="btn-ghost text-xs w-full flex items-center justify-center gap-1"
        onClick={() => setShowMore(!showMore)}
      >
        <span>{showMore ? '▲' : '▼'}</span>
        <span>{showMore ? 'Less details' : 'More details'}</span>
      </button>

      {showMore && (
        <>
          <div className="divider" />
          <div>
            <label className="input-label">Category</label>
            <PillSelector
              options={[...CATEGORY_TAGS]}
              value={fields.categoryTag ?? ''}
              onChange={(v) => onChange({ ...fields, categoryTag: v as FinanceCategoryTag })}
            />
          </div>
          <div>
            <label className="input-label">Payment method</label>
            <PillSelector
              options={[...PAYMENT_METHODS]}
              value={fields.paymentMethod ?? ''}
              onChange={(v) => onChange({ ...fields, paymentMethod: v as FinanceFields['paymentMethod'] })}
            />
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="input-label mb-0">Recurring</span>
            <button
              type="button"
              onClick={() => onChange({ ...fields, recurring: !fields.recurring })}
              className="relative w-12 h-6 rounded-full transition-colors duration-200"
              style={{
                background: fields.recurring ? 'var(--accent-red)' : 'var(--border)',
              }}
              role="switch"
              aria-checked={fields.recurring}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
                style={{
                  transform: fields.recurring ? 'translateX(26px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
