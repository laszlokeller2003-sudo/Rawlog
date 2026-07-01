import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { SocialFields } from '@/types'
import { GaugeInput } from '@/components/GaugeInput'
import { PillSelector } from '@/components/PillSelector'
import { Input } from '@/components/Input'

interface SocialFormProps {
  fields: SocialFields
  onChange: (f: SocialFields) => void
}

const SETTINGS = ['Zuhause', 'Draußen', 'Restaurant', 'Bar', 'Online', 'Arbeit', 'Sonstiges']
const SETTING_KEYS = ['zuhause', 'draussen', 'restaurant', 'bar', 'online', 'arbeit', 'sonstiges']

const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'WhatsApp', 'Twitter', 'Reddit', 'Sonstiges']
const PLATFORM_KEYS = ['instagram', 'tiktok', 'youtube', 'whatsapp', 'twitter', 'reddit', 'sonstiges']

function labelMap(t: (key: string) => string, ns: string, values: readonly string[], keys: readonly string[]): Record<string, string> {
  return Object.fromEntries(values.map((v, i) => [v, t(`forms.social.${ns}.${keys[i]}`)]))
}

function calcTimeDiff(start?: string, end?: string): number | undefined {
  if (!start || !end) return undefined
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins <= 0) mins += 24 * 60
  return mins
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="input-label mb-0">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className="relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
        style={{ background: value ? 'var(--accent-red)' : 'var(--border)' }}
        role="switch"
        aria-checked={value}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
          style={{ transform: value ? 'translateX(26px)' : 'translateX(2px)' }}
        />
      </button>
    </div>
  )
}

export function SocialForm({ fields, onChange }: SocialFormProps) {
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const settingLabels = labelMap(t, 'settings', SETTINGS, SETTING_KEYS)
  const platformLabels = labelMap(t, 'platforms', PLATFORMS, PLATFORM_KEYS)

  useEffect(() => {
    const auto = calcTimeDiff(fields.startTime, fields.endTime)
    if (auto !== undefined && auto !== fields.duration) {
      onChange({ ...fields, duration: auto })
    }
  }, [fields.startTime, fields.endTime])

  const hours = Math.floor((fields.duration ?? 0) / 60)
  const mins = (fields.duration ?? 0) % 60

  return (
    <div className="space-y-4">
      {/* Who */}
      <Input
        label={t('forms.social.withWhom')}
        value={fields.who ?? ''}
        onChange={(v) => onChange({ ...fields, who: v || undefined })}
        placeholder={t('forms.social.withWhomPlaceholder')}
      />

      {/* Activity */}
      <Input
        label={t('forms.social.activity')}
        value={fields.activity ?? ''}
        onChange={(v) => onChange({ ...fields, activity: v || undefined })}
        placeholder={t('forms.social.activityPlaceholder')}
      />

      {/* Setting */}
      <div>
        <label className="input-label">{t('forms.social.location')}</label>
        <PillSelector
          options={SETTINGS}
          labels={settingLabels}
          value={fields.setting ?? ''}
          onChange={(v) => onChange({ ...fields, setting: v as string })}
        />
      </div>

      {/* Start + End time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">{t('forms.social.start')}</label>
          <input
            className="input-field"
            type="time"
            value={fields.startTime ?? ''}
            onChange={(e) => onChange({ ...fields, startTime: e.target.value || undefined })}
            style={{ borderRadius: 0, colorScheme: 'dark' }}
          />
        </div>
        <div>
          <label className="input-label">{t('forms.social.end')}</label>
          <input
            className="input-field"
            type="time"
            value={fields.endTime ?? ''}
            onChange={(e) => onChange({ ...fields, endTime: e.target.value || undefined })}
            style={{ borderRadius: 0, colorScheme: 'dark' }}
          />
        </div>
      </div>
      {fields.duration !== undefined && fields.duration > 0 && (
        <div className="text-center">
          <span className="font-mono text-base font-bold" style={{ color: '#06B6D4' }}>
            {hours > 0 ? `${hours}h ` : ''}{mins}m
          </span>
          <span className="text-xs ml-1" style={{ color: '#444444' }}>{t('forms.social.duration')}</span>
        </div>
      )}

      {/* Energy before + after gauges */}
      <GaugeInput
        label={t('forms.social.energyBefore')}
        value={fields.energyBefore ?? 0}
        onChange={(v) => onChange({ ...fields, energyBefore: v })}
        color="#06B6D4"
      />
      <GaugeInput
        label={t('forms.social.energyAfter')}
        value={fields.energyAfter === 'energized' ? 8 : fields.energyAfter === 'neutral' ? 5 : fields.energyAfter === 'drained' ? 2 : 0}
        onChange={(v) => {
          const val = v >= 7 ? 'energized' : v >= 4 ? 'neutral' : 'drained'
          onChange({ ...fields, energyAfter: val })
        }}
        color="#06B6D4"
      />
      <GaugeInput
        label={t('forms.social.quality')}
        value={fields.quality ?? 0}
        onChange={(v) => onChange({ ...fields, quality: v })}
        color="#06B6D4"
      />

      <button
        type="button"
        className="btn-ghost text-xs w-full flex items-center justify-center gap-1"
        onClick={() => setShowMore(!showMore)}
      >
        <span>{showMore ? '▲' : '▼'}</span>
        <span>{showMore ? t('forms.lessDetails') : t('forms.social.timeBreakdown')}</span>
      </button>

      {showMore && (
        <>
          <div className="divider" />
          <div className="space-y-3">
            {/* Social Media */}
            <div>
              <label className="input-label">{t('forms.social.socialMedia')}</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <PillSelector
                    options={PLATFORMS}
                    labels={platformLabels}
                    value={fields.socialMediaPlatform ?? ''}
                    onChange={(v) => onChange({ ...fields, socialMediaPlatform: v as string })}
                  />
                </div>
                <div>
                  <input
                    className="input-field"
                    type="number"
                    min="0"
                    step="5"
                    value={fields.socialMediaMinutes ?? ''}
                    onChange={(e) => onChange({ ...fields, socialMediaMinutes: parseInt(e.target.value) || undefined })}
                    placeholder={t('forms.social.minutesPlaceholder')}
                    style={{ borderRadius: 0 }}
                  />
                </div>
              </div>
            </div>

            {/* Me-Time */}
            <div>
              <label className="input-label">{t('forms.social.meTime')}</label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={fields.meTimeActivity ?? ''}
                  onChange={(v) => onChange({ ...fields, meTimeActivity: v || undefined })}
                  placeholder={t('forms.social.meTimeActivityPlaceholder')}
                />
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="5"
                  value={fields.meTimeMinutes ?? ''}
                  onChange={(e) => onChange({ ...fields, meTimeMinutes: parseInt(e.target.value) || undefined })}
                  placeholder={t('forms.social.minutesPlaceholder')}
                  style={{ borderRadius: 0 }}
                />
              </div>
            </div>

            {/* Friend / Family / Partner minutes */}
            {[
              { label: t('forms.social.friends'), key: 'friendMinutes' as const },
              { label: t('forms.social.family'), key: 'familyMinutes' as const },
              { label: t('forms.social.partner'), key: 'partnerMinutes' as const },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center gap-3">
                <label className="input-label mb-0 w-20 flex-shrink-0">{label}</label>
                <input
                  className="input-field flex-1"
                  type="number"
                  min="0"
                  step="5"
                  value={fields[key] ?? ''}
                  onChange={(e) => onChange({ ...fields, [key]: parseInt(e.target.value) || undefined })}
                  placeholder={t('forms.social.minutesPlaceholder')}
                  style={{ borderRadius: 0 }}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
