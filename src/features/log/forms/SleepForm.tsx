import { useState } from 'react'
import type { SleepFields } from '@/types'
import { RatingSlider } from '@/components/RatingSlider'
import { useProfileStore } from '@/stores/useProfileStore'

interface SleepFormProps {
  fields: SleepFields
  onChange: (f: SleepFields) => void
}

export function SleepForm({ fields, onChange }: SleepFormProps) {
  const [showMore, setShowMore] = useState(false)
  const { profile } = useProfileStore()

  const totalMinutes = fields.duration ?? 0
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60

  const handleHoursChange = (val: string) => {
    const h = parseInt(val) || 0
    onChange({ ...fields, duration: h * 60 + mins })
  }

  const handleMinsChange = (val: string) => {
    const m = parseInt(val) || 0
    onChange({ ...fields, duration: hours * 60 + Math.min(59, m) })
  }

  return (
    <div className="space-y-4">
      {/* Quick: Duration (hours + minutes) */}
      <div>
        <label className="input-label">Duration</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              className="input-field"
              type="number"
              min="0"
              max="24"
              step="1"
              value={hours || ''}
              onChange={(e) => handleHoursChange(e.target.value)}
              placeholder="0"
              style={{ borderRadius: 0 }}
            />
            <div className="text-[10px] uppercase tracking-widest mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
              Hours
            </div>
          </div>
          <div className="flex-1">
            <input
              className="input-field"
              type="number"
              min="0"
              max="59"
              step="1"
              value={mins || ''}
              onChange={(e) => handleMinsChange(e.target.value)}
              placeholder="0"
              style={{ borderRadius: 0 }}
            />
            <div className="text-[10px] uppercase tracking-widest mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
              Minutes
            </div>
          </div>
        </div>
      </div>

      {/* Quick: Quality */}
      <RatingSlider
        label="Quality"
        value={fields.quality ?? 0}
        onChange={(v) => onChange({ ...fields, quality: v })}
        personalGoal={profile.sleepQualityGoal}
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
          <div className="flex items-center justify-between py-2">
            <span className="input-label mb-0">Had dreams</span>
            <button
              type="button"
              onClick={() => onChange({ ...fields, dreams: !fields.dreams })}
              className="relative w-12 h-6 rounded-full transition-colors duration-200"
              style={{
                background: fields.dreams ? 'var(--accent-red)' : 'var(--border)',
              }}
              role="switch"
              aria-checked={fields.dreams}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
                style={{
                  transform: fields.dreams ? 'translateX(26px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
