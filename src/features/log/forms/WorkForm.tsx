import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { WorkFields } from '@/types'
import { GaugeInput } from '@/components/GaugeInput'
import { PillSelector } from '@/components/PillSelector'
import { Input } from '@/components/Input'
import { useProfileStore } from '@/stores/useProfileStore'

interface WorkFormProps {
  fields: WorkFields
  onChange: (f: WorkFields) => void
}

const SESSION_TYPES = ['Deep Work', 'Meeting', 'Planung', 'E-Mails', 'Kreativ', 'Admin', 'Call', 'Andere']
const SESSION_TYPE_KEYS = ['deepWork', 'meeting', 'planung', 'emails', 'kreativ', 'admin', 'call', 'andere']

const LOCATIONS = ['Büro', 'Homeoffice', 'Café', 'Unterwegs', 'Andere']
const LOCATION_KEYS = ['buero', 'homeoffice', 'cafe', 'unterwegs', 'andere']

function labelMap(t: (key: string) => string, ns: string, values: readonly string[], keys: readonly string[]): Record<string, string> {
  return Object.fromEntries(values.map((v, i) => [v, t(`forms.work.${ns}.${keys[i]}`)]))
}

function calcShiftDuration(start?: string, end?: string, breakMins?: number): number | undefined {
  if (!start || !end) return undefined
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let total = (eh * 60 + em) - (sh * 60 + sm)
  if (total <= 0) total += 24 * 60
  return Math.max(0, total - (breakMins ?? 0))
}

export function WorkForm({ fields, onChange }: WorkFormProps) {
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)
  const { profile } = useProfileStore()
  const sessionTypeLabels = labelMap(t, 'sessionTypes', SESSION_TYPES, SESSION_TYPE_KEYS)
  const locationLabels = labelMap(t, 'locations', LOCATIONS, LOCATION_KEYS)

  useEffect(() => {
    if (fields.shiftMode) {
      const net = calcShiftDuration(fields.shiftStart, fields.shiftEnd, fields.breakMinutes)
      if (net !== undefined && net !== fields.duration) {
        onChange({ ...fields, duration: net })
      }
    }
  }, [fields.shiftMode, fields.shiftStart, fields.shiftEnd, fields.breakMinutes])

  const hours = Math.floor((fields.duration ?? 0) / 60)
  const mins = (fields.duration ?? 0) % 60

  const manualHours = Math.floor((fields.duration ?? 0) / 60)
  const manualMins = (fields.duration ?? 0) % 60

  return (
    <div className="space-y-4">
      {/* Session type */}
      <div>
        <label className="input-label">{t('forms.work.sessionType')}</label>
        <PillSelector
          options={SESSION_TYPES}
          labels={sessionTypeLabels}
          value={fields.sessionType ?? ''}
          onChange={(v) => onChange({ ...fields, sessionType: v as string })}
        />
      </div>

      {/* Shift mode toggle */}
      <div className="flex items-center justify-between py-1">
        <div>
          <span className="input-label mb-0">{t('forms.work.shiftMode')}</span>
          <div className="text-xs mt-0.5" style={{ color: '#444444' }}>{t('forms.work.shiftModeDesc')}</div>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...fields, shiftMode: !fields.shiftMode })}
          className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
          style={{ background: fields.shiftMode ? 'var(--accent-red)' : 'var(--border)' }}
          role="switch"
          aria-checked={fields.shiftMode}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
            style={{ transform: fields.shiftMode ? 'translateX(26px)' : 'translateX(2px)' }}
          />
        </button>
      </div>

      {fields.shiftMode ? (
        /* Shift mode: start + end + break */
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">{t('forms.work.start')}</label>
              <input
                className="input-field"
                type="time"
                value={fields.shiftStart ?? ''}
                onChange={(e) => onChange({ ...fields, shiftStart: e.target.value || undefined })}
                style={{ borderRadius: 0, colorScheme: 'dark' }}
              />
            </div>
            <div>
              <label className="input-label">{t('forms.work.end')}</label>
              <input
                className="input-field"
                type="time"
                value={fields.shiftEnd ?? ''}
                onChange={(e) => onChange({ ...fields, shiftEnd: e.target.value || undefined })}
                style={{ borderRadius: 0, colorScheme: 'dark' }}
              />
            </div>
          </div>
          <div>
            <label className="input-label">{t('forms.work.breakMinutes')}</label>
            <input
              className="input-field"
              type="number"
              min="0"
              step="5"
              value={fields.breakMinutes ?? ''}
              onChange={(e) => onChange({ ...fields, breakMinutes: parseInt(e.target.value) || undefined })}
              placeholder="0"
              style={{ borderRadius: 0 }}
            />
          </div>
          {fields.duration !== undefined && fields.duration > 0 && (
            <div className="text-center py-1">
              <span className="font-mono text-lg font-bold" style={{ color: '#6366F1' }}>
                {t('forms.work.netDuration', { hours, mins })}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Manual duration */
        <div>
          <label className="input-label">{t('forms.work.duration')}</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                className="input-field"
                type="number"
                min="0"
                max="24"
                value={manualHours || ''}
                onChange={(e) => {
                  const h = parseInt(e.target.value) || 0
                  onChange({ ...fields, duration: h * 60 + manualMins })
                }}
                placeholder="0"
                style={{ borderRadius: 0 }}
              />
              <div className="text-[10px] uppercase tracking-widest mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>{t('forms.work.hours')}</div>
            </div>
            <div className="flex-1">
              <input
                className="input-field"
                type="number"
                min="0"
                max="59"
                value={manualMins || ''}
                onChange={(e) => {
                  const m = Math.min(59, parseInt(e.target.value) || 0)
                  onChange({ ...fields, duration: manualHours * 60 + m })
                }}
                placeholder="0"
                style={{ borderRadius: 0 }}
              />
              <div className="text-[10px] uppercase tracking-widest mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>{t('forms.work.minutes')}</div>
            </div>
          </div>
        </div>
      )}

      {/* Focus gauge */}
      <GaugeInput
        label={t('forms.work.focus')}
        value={fields.focusScore ?? 0}
        onChange={(v) => onChange({ ...fields, focusScore: v })}
        personalGoal={profile.workFocusGoal}
        color="#6366F1"
      />

      <button
        type="button"
        className="btn-ghost text-xs w-full flex items-center justify-center gap-1"
        onClick={() => setShowMore(!showMore)}
      >
        <span>{showMore ? '▲' : '▼'}</span>
        <span>{showMore ? t('forms.lessDetails') : t('forms.moreDetails')}</span>
      </button>

      {showMore && (
        <>
          <div className="divider" />

          <div>
            <label className="input-label">{t('forms.work.tasksCompleted')}</label>
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

          <Input
            label={t('forms.work.winOfTheDay')}
            value={fields.win ?? ''}
            onChange={(v) => onChange({ ...fields, win: v || undefined })}
            placeholder={t('forms.work.winPlaceholder')}
          />

          <Input
            label={t('forms.work.blocker')}
            value={fields.blocker ?? ''}
            onChange={(v) => onChange({ ...fields, blocker: v || undefined })}
            placeholder={t('forms.work.blockerPlaceholder')}
          />

          <GaugeInput
            label={t('forms.work.energy')}
            value={fields.energyScore ?? 0}
            onChange={(v) => onChange({ ...fields, energyScore: v })}
            color="#6366F1"
          />

          <div>
            <label className="input-label">{t('forms.work.location')}</label>
            <PillSelector
              options={LOCATIONS}
              labels={locationLabels}
              value={fields.location ?? ''}
              onChange={(v) => onChange({ ...fields, location: v as string })}
            />
          </div>
        </>
      )}
    </div>
  )
}
