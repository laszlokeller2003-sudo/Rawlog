import { useState } from 'react'
import type { FitnessFields } from '@/types'
import { RatingSlider } from '@/components/RatingSlider'

interface FitnessFormProps {
  fields: FitnessFields
  onChange: (f: FitnessFields) => void
}

export function FitnessForm({ fields, onChange }: FitnessFormProps) {
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="space-y-4">
      {/* Quick: Duration */}
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

      {/* Quick: Intensity */}
      <RatingSlider
        label="Intensity"
        value={fields.intensity ?? 0}
        onChange={(v) => onChange({ ...fields, intensity: v })}
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
            <label className="input-label">Distance (km)</label>
            <input
              className="input-field"
              type="number"
              min="0"
              step="0.1"
              value={fields.distance ?? ''}
              onChange={(e) => onChange({ ...fields, distance: parseFloat(e.target.value) || undefined })}
              placeholder="0.0"
              style={{ borderRadius: 0 }}
            />
          </div>
          <div>
            <label className="input-label">Calories burned</label>
            <input
              className="input-field"
              type="number"
              min="0"
              step="1"
              value={fields.caloriesBurned ?? ''}
              onChange={(e) => onChange({ ...fields, caloriesBurned: parseInt(e.target.value) || undefined })}
              placeholder="0"
              style={{ borderRadius: 0 }}
            />
          </div>
        </>
      )}
    </div>
  )
}
