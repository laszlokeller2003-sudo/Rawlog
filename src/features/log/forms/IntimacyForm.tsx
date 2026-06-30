import { useState } from 'react'
import type { IntimacyFields } from '@/types'
import { RatingSlider } from '@/components/RatingSlider'
import { Input } from '@/components/Input'

interface IntimacyFormProps {
  subcategory?: string
  fields: IntimacyFields
  onChange: (f: IntimacyFields) => void
}

export function IntimacyForm({ subcategory, fields, onChange }: IntimacyFormProps) {
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="space-y-4">
      {/* Quick Inputs */}
      <Input
        label="Partner / Initials"
        value={fields.partner ?? ''}
        onChange={(v) => onChange({ ...fields, partner: v || undefined })}
        placeholder="Name or alias..."
      />

      <RatingSlider
        label="Rating"
        value={fields.rating ?? 0}
        onChange={(v) => onChange({ ...fields, rating: v })}
      />

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
          <Input
            label="Location (optional)"
            value={fields.location ?? ''}
            onChange={(v) => onChange({ ...fields, location: v || undefined })}
            placeholder="e.g. Home, Hotel..."
          />
          
          <div>
            <label className="input-label">Duration (minutes)</label>
            <input
              className="input-field"
              type="number"
              min="0"
              step="1"
              value={fields.duration ?? ''}
              onChange={(e) => onChange({ ...fields, duration: parseInt(e.target.value) || undefined })}
              placeholder="0"
              style={{ borderRadius: 0 }}
            />
          </div>

          {subcategory === 'Sex' && (
            <div>
              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={fields.protection ?? false}
                  onChange={(e) => onChange({ ...fields, protection: e.target.checked })}
                />
                Protection used
              </label>
            </div>
          )}
        </>
      )}
    </div>
  )
}
