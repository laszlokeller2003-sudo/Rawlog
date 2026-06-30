import { useState } from 'react'
import type { MoodFields, MoodTrigger, MoodEmotion } from '@/types'
import { GaugeInput } from '@/components/GaugeInput'
import { PillSelector } from '@/components/PillSelector'
import { useProfileStore } from '@/stores/useProfileStore'

interface MoodFormProps {
  fields: MoodFields
  onChange: (f: MoodFields) => void
}

const EMOTIONS: { emotion: MoodEmotion; emoji: string }[] = [
  { emotion: 'Happy', emoji: '😊' },
  { emotion: 'Sad', emoji: '😢' },
  { emotion: 'Stressed', emoji: '😤' },
  { emotion: 'Relaxed', emoji: '😌' },
  { emotion: 'Angry', emoji: '😡' },
  { emotion: 'Motivated', emoji: '💪' },
  { emotion: 'Tired', emoji: '😴' },
  { emotion: 'Anxious', emoji: '😰' },
  { emotion: 'Euphoric', emoji: '🤩' },
  { emotion: 'Depressed', emoji: '😔' },
  { emotion: 'Neutral', emoji: '😐' },
  { emotion: 'Grateful', emoji: '🙏' },
  { emotion: 'Frustrated', emoji: '😤' },
  { emotion: 'Lonely', emoji: '🥺' },
  { emotion: 'Excited', emoji: '🎉' },
  { emotion: 'Calm', emoji: '🧘' },
]

const BODY_FEELINGS = ['Leicht', 'Schwer', 'Angespannt', 'Entspannt', 'Energielos', 'Voller Energie']
const TRIGGERS: MoodTrigger[] = ['work', 'relationships', 'health', 'money', 'sleep', 'substances', 'weather', 'other']
const HELPERS = ['Musik', 'Sport', 'Freunde', 'Schlaf', 'Natur', 'Meditation', 'Essen', 'Spaziergang']

export function MoodForm({ fields, onChange }: MoodFormProps) {
  const [showMore, setShowMore] = useState(false)
  const { profile } = useProfileStore()

  return (
    <div className="space-y-4">
      {/* Primary emotion picker */}
      <div>
        <label className="input-label">Wie fühlst du dich?</label>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {EMOTIONS.map(({ emotion, emoji }) => (
            <button
              key={emotion}
              type="button"
              onClick={() => onChange({ ...fields, primaryEmotion: emotion })}
              className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-150"
              style={{
                border: fields.primaryEmotion === emotion ? '2px solid var(--accent-red)' : '2px solid var(--border)',
                background: fields.primaryEmotion === emotion ? 'var(--accent-red-dim)' : 'var(--bg-elevated)',
              }}
            >
              <span style={{ fontSize: 22 }}>{emoji}</span>
              <span style={{ fontSize: 9, color: fields.primaryEmotion === emotion ? '#F5F5F5' : '#888888', fontWeight: 600 }}>
                {emotion}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Intensity gauge */}
      <GaugeInput
        label="Intensität"
        value={fields.intensity ?? 0}
        onChange={(v) => onChange({ ...fields, intensity: v })}
        personalGoal={profile.moodGoal}
        color="#EAB308"
      />

      <button
        type="button"
        className="btn-ghost text-xs w-full flex items-center justify-center gap-1"
        onClick={() => setShowMore(!showMore)}
      >
        <span>{showMore ? '▲' : '▼'}</span>
        <span>{showMore ? 'Weniger' : 'Mehr Details'}</span>
      </button>

      {showMore && (
        <>
          <div className="divider" />

          {/* Body feeling */}
          <div>
            <label className="input-label">Körpergefühl</label>
            <PillSelector
              options={BODY_FEELINGS}
              value={fields.bodyFeeling ?? ''}
              onChange={(v) => onChange({ ...fields, bodyFeeling: v as string })}
            />
          </div>

          {/* Triggers */}
          <div>
            <label className="input-label">Auslöser</label>
            <PillSelector
              options={[...TRIGGERS]}
              value={fields.triggers ?? []}
              onChange={(v) => onChange({ ...fields, triggers: v as MoodTrigger[] })}
              multi
            />
          </div>

          {/* Helpers */}
          <div>
            <label className="input-label">Was hilft dir?</label>
            <PillSelector
              options={HELPERS}
              value={fields.helpers ?? []}
              onChange={(v) => onChange({ ...fields, helpers: v as string[] })}
              multi
            />
          </div>
        </>
      )}
    </div>
  )
}
