import { useState } from 'react'
import type { NutritionFields } from '@/types'
import { RatingSlider } from '@/components/RatingSlider'

interface NutritionFormProps {
  fields: NutritionFields
  onChange: (f: NutritionFields) => void
}

export function NutritionForm({ fields, onChange }: NutritionFormProps) {
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="space-y-4">
      {/* Quick: Quality */}
      <RatingSlider
        label="Meal Quality"
        value={fields.quality ?? 0}
        onChange={(v) => onChange({ ...fields, quality: v })}
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
          <div>
            <label className="input-label">Calories (kcal)</label>
            <input
              className="input-field"
              type="number"
              min="0"
              step="1"
              value={fields.calories ?? ''}
              onChange={(e) => onChange({ ...fields, calories: parseInt(e.target.value) || undefined })}
              placeholder="0"
              style={{ borderRadius: 0 }}
            />
          </div>
          <div>
            <label className="input-label">Water (ml)</label>
            <input
              className="input-field"
              type="number"
              min="0"
              step="50"
              value={fields.water ?? ''}
              onChange={(e) => onChange({ ...fields, water: parseInt(e.target.value) || undefined })}
              placeholder="0"
              style={{ borderRadius: 0 }}
            />
          </div>
        </>
      )}
    </div>
  )
}
