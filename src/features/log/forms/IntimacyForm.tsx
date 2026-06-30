import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { IntimacyFields } from '@/types'
import { RatingSlider } from '@/components/RatingSlider'
import { Input } from '@/components/Input'

interface IntimacyFormProps {
  subcategory?: string
  fields: IntimacyFields
  onChange: (f: IntimacyFields) => void
}

export function IntimacyForm({ subcategory, fields, onChange }: IntimacyFormProps) {
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)

  return (
    <div className="space-y-4">
      <Input
        label={t('forms.partnerInitials')}
        value={fields.partner ?? ''}
        onChange={(v) => onChange({ ...fields, partner: v || undefined })}
        placeholder={t('forms.partnerPlaceholder')}
      />

      <RatingSlider
        label={t('forms.rating')}
        value={fields.rating ?? 0}
        onChange={(v) => onChange({ ...fields, rating: v })}
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
          <Input
            label={t('forms.locationOptional')}
            value={fields.location ?? ''}
            onChange={(v) => onChange({ ...fields, location: v || undefined })}
            placeholder={t('forms.locationPlaceholder')}
          />

          <div>
            <label className="input-label">{t('forms.durationMin')}</label>
            <input
              className="input-field"
              type="number"
              min="0"
              step="1"
              value={fields.duration ?? ''}
              onChange={(e) => onChange({ ...fields, duration: parseInt(e.target.value) || undefined })}
              placeholder="0"
              style={{ borderRadius: 0 }}
            />
          </div>

          {subcategory === 'Sex' && (
            <div>
              <label className="flex items-center gap-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={fields.protection ?? false}
                  onChange={(e) => onChange({ ...fields, protection: e.target.checked })}
                />
                {t('forms.protectionUsed')}
              </label>
            </div>
          )}
        </>
      )}
    </div>
  )
}
