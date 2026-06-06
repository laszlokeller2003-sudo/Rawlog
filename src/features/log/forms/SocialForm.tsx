import { useState } from 'react'
import type { SocialFields } from '@/types'
import { RatingSlider } from '@/components/RatingSlider'
import { PillSelector } from '@/components/PillSelector'
import { Input } from '@/components/Input'

interface SocialFormProps {
  fields: SocialFields
  onChange: (f: SocialFields) => void
}

const ENERGY_OPTIONS = ['Drained', 'Neutral', 'Energized']
const ENERGY_MAP: Record<string, SocialFields['energyAfter']> = {
  Drained: 'drained',
  Neutral: 'neutral',
  Energized: 'energized',
}
const ENERGY_REVERSE: Record<string, string> = {
  drained: 'Drained',
  neutral: 'Neutral',
  energized: 'Energized',
}

export function SocialForm({ fields, onChange }: SocialFormProps) {
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="space-y-4">
      {/* Quick: Energy after */}
      <div>
        <label className="input-label">Energy after</label>
        <PillSelector
          options={ENERGY_OPTIONS}
          value={fields.energyAfter ? ENERGY_REVERSE[fields.energyAfter] : ''}
          onChange={(v) => onChange({ ...fields, energyAfter: ENERGY_MAP[v as string] })}
        />
      </div>

      {/* Quick: Quality */}
      <RatingSlider
        label="Quality"
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
          <Input
            label="Who was there? (optional)"
            value={fields.who ?? ''}
            onChange={(v) => onChange({ ...fields, who: v || undefined })}
            placeholder="Names or group..."
          />
        </>
      )}
    </div>
  )
}
