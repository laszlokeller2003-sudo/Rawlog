import { useState } from 'react'
import type { HealthFields } from '@/types'
import { RatingSlider } from '@/components/RatingSlider'
import { Input } from '@/components/Input'

interface HealthFormProps {
  fields: HealthFields
  onChange: (f: HealthFields) => void
}

export function HealthForm({ fields, onChange }: HealthFormProps) {
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="space-y-4">
      {/* Quick Inputs */}
      <Input
        label="Symptom / Condition"
        value={fields.symptom ?? ''}
        onChange={(v) => onChange({ ...fields, symptom: v || undefined })}
        placeholder="e.g. Headache, Cough"
      />

      <RatingSlider
        label="Severity"
        value={fields.severity ?? 0}
        onChange={(v) => onChange({ ...fields, severity: v })}
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
            label="Body part (optional)"
            value={fields.bodyPart ?? ''}
            onChange={(v) => onChange({ ...fields, bodyPart: v || undefined })}
            placeholder="e.g. Kopf, Bauch, Rücken"
          />

          <Input
            label="Medication taken (optional)"
            value={fields.medication ?? ''}
            onChange={(v) => onChange({ ...fields, medication: v || undefined })}
            placeholder="e.g. 400mg Ibu"
          />

          <RatingSlider
            label="Energy level"
            value={fields.energy ?? 0}
            onChange={(v) => onChange({ ...fields, energy: v })}
          />
        </>
      )}
    </div>
  )
}
