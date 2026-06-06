import { useState } from 'react'
import type { MoodFields, MoodTrigger } from '@/types'
import { RatingSlider } from '@/components/RatingSlider'
import { PillSelector } from '@/components/PillSelector'

interface MoodFormProps {
  fields: MoodFields
  onChange: (f: MoodFields) => void
}

const MOOD_EMOJIS = ['😊', '😢', '😤', '😌', '😡', '💪', '😴', '😰', '🤩', '😔', '😐']

const TRIGGERS: MoodTrigger[] = [
  'work', 'relationships', 'health', 'money', 'sleep', 'substances', 'weather', 'other',
]

export function MoodForm({ fields, onChange }: MoodFormProps) {
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="space-y-4">
      {/* Quick: Emoji picker */}
      <div>
        <label className="input-label">How are you feeling?</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {MOOD_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange({ ...fields, emoji })}
              className="text-2xl leading-none p-2 rounded-lg transition-all duration-150"
              style={{
                border: fields.emoji === emoji ? '2px solid var(--accent-red)' : '2px solid var(--border)',
                background: fields.emoji === emoji ? 'var(--accent-red-dim)' : 'var(--bg-elevated)',
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Intensity */}
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
            <label className="input-label">Triggers</label>
            <PillSelector
              options={[...TRIGGERS]}
              value={fields.triggers ?? []}
              onChange={(v) => onChange({ ...fields, triggers: v as MoodTrigger[] })}
              multi
            />
          </div>
        </>
      )}
    </div>
  )
}
