import { useState } from 'react'
import type { NutritionFields } from '@/types'
import { RatingSlider } from '@/components/RatingSlider'
import { Input } from '@/components/Input'
import { PillSelector } from '@/components/PillSelector'

interface NutritionFormProps {
  fields: NutritionFields
  onChange: (f: NutritionFields) => void
}

const MEAL_SIZES = ['Snack', 'Klein', 'Normal', 'Groß', 'Cheat']
const WATER_PICKS = [250, 500, 1000]

export function NutritionForm({ fields, onChange }: NutritionFormProps) {
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="space-y-4">
      {/* Quick Inputs */}
      <Input
        label="Meal / Drink Name"
        value={fields.mealName ?? ''}
        onChange={(v) => onChange({ ...fields, mealName: v || undefined })}
        placeholder="e.g. Avocado Toast"
      />

      <div>
        <label className="input-label">Size</label>
        <PillSelector
          options={MEAL_SIZES}
          value={fields.size ?? ''}
          onChange={(v) => onChange({ ...fields, size: v as any })}
        />
      </div>

      <RatingSlider
        label="Healthy Rating"
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
            <label className="flex items-center gap-2 text-sm text-text-primary mb-4">
              <input
                type="checkbox"
                checked={fields.fastFood ?? false}
                onChange={(e) => onChange({ ...fields, fastFood: e.target.checked })}
              />
              Fast Food / Junk Food
            </label>
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
            <div className="flex gap-2 mt-2">
              {WATER_PICKS.map((ml) => (
                <button
                  key={ml}
                  type="button"
                  className="px-2 py-1 text-xs bg-bg-elevated border border-border rounded"
                  onClick={() => onChange({ ...fields, water: (fields.water || 0) + ml })}
                >
                  +{ml}ml
                </button>
              ))}
            </div>
          </div>

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
        </>
      )}
    </div>
  )
}
