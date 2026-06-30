import { useState, useEffect } from 'react'
import type { SleepFields } from '@/types'
import { GaugeInput } from '@/components/GaugeInput'
import { PillSelector } from '@/components/PillSelector'
import { Input } from '@/components/Input'
import { useProfileStore } from '@/stores/useProfileStore'

interface SleepFormProps {
  fields: SleepFields
  onChange: (f: SleepFields) => void
}

const SLEEP_AIDS = ['Keins', 'Melatonin', 'Magnesium', 'CBD', 'Alkohol', 'Schlaftabletten', 'Kräutertee']
const ENVIRONMENTS = ['Zuhause', 'Hotel', 'Sofa', 'Draußen', 'Freunde', 'Unterwegs']

function calcDuration(bedtime?: string, waketime?: string): number | undefined {
  if (!bedtime || !waketime) return undefined
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = waketime.split(':').map(Number)
  let mins = (wh * 60 + wm) - (bh * 60 + bm)
  if (mins <= 0) mins += 24 * 60 // crossed midnight
  return mins
}

export function SleepForm({ fields, onChange }: SleepFormProps) {
  const [showMore, setShowMore] = useState(false)
  const { profile } = useProfileStore()

  // Auto-calc duration when bedtime or waketime changes
  useEffect(() => {
    const auto = calcDuration(fields.bedtime, fields.waketime)
    if (auto !== undefined && auto !== fields.duration) {
      onChange({ ...fields, duration: auto })
    }
  }, [fields.bedtime, fields.waketime])

  const hours = Math.floor((fields.duration ?? 0) / 60)
  const mins = (fields.duration ?? 0) % 60

  return (
    <div className="space-y-4">
      {/* Bedtime + Waketime */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">Einschlafen</label>
          <input
            className="input-field"
            type="time"
            value={fields.bedtime ?? ''}
            onChange={(e) => onChange({ ...fields, bedtime: e.target.value || undefined })}
            style={{ borderRadius: 0, colorScheme: 'dark' }}
          />
        </div>
        <div>
          <label className="input-label">Aufwachen</label>
          <input
            className="input-field"
            type="time"
            value={fields.waketime ?? ''}
            onChange={(e) => onChange({ ...fields, waketime: e.target.value || undefined })}
            style={{ borderRadius: 0, colorScheme: 'dark' }}
          />
        </div>
      </div>

      {/* Auto-calculated duration (or manual) */}
      {fields.duration !== undefined && (
        <div className="text-center py-1">
          <span className="font-mono text-lg font-bold" style={{ color: '#3B82F6' }}>
            {hours}h {mins}m
          </span>
          <span className="text-xs ml-2" style={{ color: '#444444' }}>Schlafdauer</span>
        </div>
      )}

      {/* Quality gauge */}
      <GaugeInput
        label="Schlafqualität"
        value={fields.quality ?? 0}
        onChange={(v) => onChange({ ...fields, quality: v })}
        personalGoal={profile.sleepQualityGoal}
        color="#3B82F6"
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

          {/* Times woken */}
          <div>
            <label className="input-label">Mal aufgewacht</label>
            <input
              className="input-field"
              type="number"
              min="0"
              step="1"
              value={fields.timesWoken ?? ''}
              onChange={(e) => onChange({ ...fields, timesWoken: parseInt(e.target.value) || undefined })}
              placeholder="0"
              style={{ borderRadius: 0 }}
            />
          </div>

          {/* Dream toggle + text */}
          <div className="flex items-center justify-between py-1">
            <span className="input-label mb-0">Geträumt</span>
            <button
              type="button"
              onClick={() => onChange({ ...fields, dreams: !fields.dreams, dreamText: fields.dreams ? undefined : fields.dreamText })}
              className="relative w-12 h-6 rounded-full transition-colors duration-200"
              style={{ background: fields.dreams ? 'var(--accent-red)' : 'var(--border)' }}
              role="switch"
              aria-checked={fields.dreams}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
                style={{ transform: fields.dreams ? 'translateX(26px)' : 'translateX(2px)' }}
              />
            </button>
          </div>
          {fields.dreams && (
            <Input
              label="Traum-Notiz"
              value={fields.dreamText ?? ''}
              onChange={(v) => onChange({ ...fields, dreamText: v || undefined })}
              placeholder="Was hast du geträumt?"
            />
          )}

          {/* Sleep aid */}
          <div>
            <label className="input-label">Einschlafhilfe</label>
            <PillSelector
              options={SLEEP_AIDS}
              value={fields.sleepAid ?? ''}
              onChange={(v) => onChange({ ...fields, sleepAid: v as string })}
            />
          </div>

          {/* Environment */}
          <div>
            <label className="input-label">Umgebung</label>
            <PillSelector
              options={ENVIRONMENTS}
              value={fields.environment ?? ''}
              onChange={(v) => onChange({ ...fields, environment: v as string })}
            />
          </div>
        </>
      )}
    </div>
  )
}
