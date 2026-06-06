import { useState } from 'react'
import type { SubstanceFields } from '@/types'
import { RatingSlider } from '@/components/RatingSlider'
import { PillSelector } from '@/components/PillSelector'

interface SubstancesFormProps {
  fields: SubstanceFields
  onChange: (f: SubstanceFields) => void
}

const UNITS = ['pieces', 'ml', 'mg'] as const

export function SubstancesForm({ fields, onChange }: SubstancesFormProps) {
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="space-y-4">
      {/* Quick: Quantity + Unit */}
      <div>
        <label className="input-label">Quantity</label>
        <div className="flex gap-2 items-start">
          <input
            className="input-field flex-1"
            type="number"
            min="0"
            step="0.1"
            value={fields.quantity ?? ''}
            onChange={(e) => onChange({ ...fields, quantity: parseFloat(e.target.value) || undefined })}
            placeholder="0"
            style={{ borderRadius: 0 }}
          />
          <PillSelector
            options={[...UNITS]}
            value={fields.unit ?? 'pieces'}
            onChange={(v) => onChange({ ...fields, unit: v as SubstanceFields['unit'] })}
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
          <RatingSlider
            label="Mood before"
            value={fields.moodBefore ?? 0}
            onChange={(v) => onChange({ ...fields, moodBefore: v })}
          />
          <RatingSlider
            label="Mood after"
            value={fields.moodAfter ?? 0}
            onChange={(v) => onChange({ ...fields, moodAfter: v })}
          />
        </>
      )}
    </div>
  )
}
