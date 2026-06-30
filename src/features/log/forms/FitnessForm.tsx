import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FitnessFields } from '@/types'
import { RatingSlider } from '@/components/RatingSlider'
import { useProfileStore } from '@/stores/useProfileStore'

interface FitnessFormProps {
  fields: FitnessFields
  onChange: (f: FitnessFields) => void
}

export function FitnessForm({ fields, onChange }: FitnessFormProps) {
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)
  const { profile } = useProfileStore()

  return (
    <div className="space-y-4">
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

      <RatingSlider
        label={t('forms.intensity')}
        value={fields.intensity ?? 0}
        onChange={(v) => onChange({ ...fields, intensity: v })}
        personalGoal={profile.fitnessIntensityGoal}
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
            <label className="input-label">{t('forms.distanceKm')}</label>
            <input
              className="input-field"
              type="number"
              min="0"
              step="0.1"
              value={fields.distance ?? ''}
              onChange={(e) => onChange({ ...fields, distance: parseFloat(e.target.value) || undefined })}
              placeholder="0.0"
              style={{ borderRadius: 0 }}
            />
          </div>
          <div>
            <label className="input-label">{t('forms.caloriesBurned')}</label>
            <input
              className="input-field"
              type="number"
              min="0"
              step="1"
              value={fields.caloriesBurned ?? ''}
              onChange={(e) => onChange({ ...fields, caloriesBurned: parseInt(e.target.value) || undefined })}
              placeholder="0"
              style={{ borderRadius: 0 }}
            />
          </div>
        </>
      )}
    </div>
  )
}
