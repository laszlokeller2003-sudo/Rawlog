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
      {/* Quick: Severity */}
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
            label="Body part"
            value={fields.bodyPart ?? ''}
            onChange={(v) => onChange({ ...fields, bodyPart: v || undefined })}
            placeholder="e.g. head, back, knee"
          />
        </>
      )}
    </div>
  )
}
