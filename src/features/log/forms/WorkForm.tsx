import { useState } from 'react'
import type { WorkFields } from '@/types'
import { RatingSlider } from '@/components/RatingSlider'

interface WorkFormProps {
  fields: WorkFields
  onChange: (f: WorkFields) => void
}

export function WorkForm({ fields, onChange }: WorkFormProps) {
  const [showMore, setShowMore] = useState(false)

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
      {/* Quick: Duration */}
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

      {/* Quick: Focus score */}
      <RatingSlider
        label="Focus Score"
        value={fields.focusScore ?? 0}
        onChange={(v) => onChange({ ...fields, focusScore: v })}
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
            <label className="input-label">Tasks completed (optional)</label>
            <input
              className="input-field"
              type="number"
              min="0"
              step="1"
              value={fields.tasksCompleted ?? ''}
              onChange={(e) => onChange({ ...fields, tasksCompleted: parseInt(e.target.value) || undefined })}
              placeholder="0"
              style={{ borderRadius: 0 }}
            />
          </div>
        </>
      )}
    </div>
  )
}
