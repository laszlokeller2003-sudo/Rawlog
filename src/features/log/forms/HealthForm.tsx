import { useTranslation } from 'react-i18next'
import type { HealthFields, HealthEventType } from '@/types'
import { GaugeInput } from '@/components/GaugeInput'
import { PillSelector } from '@/components/PillSelector'
import { Input } from '@/components/Input'

interface HealthFormProps {
  fields: HealthFields
  onChange: (f: HealthFields) => void
}

const EVENT_TYPES: HealthEventType[] = ['Medikament', 'Symptom', 'Messung', 'Supplement', 'Energie']
const EVENT_TYPE_KEYS = ['medikament', 'symptom', 'messung', 'supplement', 'energie']

const MED_UNITS = ['mg', 'ml', 'Tabletten', 'Tropfen', 'Sprühstöße']
const MED_UNIT_KEYS = ['mg', 'ml', 'tabletten', 'tropfen', 'spruehstoesse']

const MED_TIMINGS = ['Morgens', 'Mittags', 'Abends', 'Nachts', 'Bei Bedarf']
const MED_TIMING_KEYS = ['morgens', 'mittags', 'abends', 'nachts', 'beiBedarf']

const BODY_PARTS = ['Kopf', 'Bauch', 'Rücken', 'Brust', 'Kehle', 'Gelenke', 'Muskeln', 'Sonstiges']
const BODY_PART_KEYS = ['kopf', 'bauch', 'ruecken', 'brust', 'kehle', 'gelenke', 'muskeln', 'sonstiges']

const SYMPTOM_DURATIONS = ['Kurz (<1h)', 'Stunden', 'Tag', 'Mehrere Tage']
const SYMPTOM_DURATION_KEYS = ['kurz', 'stunden', 'tag', 'mehrereTage']

const MEASURE_TYPES = ['Gewicht', 'Blutdruck', 'Puls', 'Blutzucker', 'Temperatur', 'Andere']
const MEASURE_TYPE_KEYS = ['gewicht', 'blutdruck', 'puls', 'blutzucker', 'temperatur', 'andere']

const SUPP_TIMINGS = ['Morgens', 'Mittags', 'Abends', 'Pre-Workout', 'Post-Workout', 'Vor dem Schlafen']
const SUPP_TIMING_KEYS = ['morgens', 'mittags', 'abends', 'preWorkout', 'postWorkout', 'vorDemSchlafen']

function labelMap(t: (key: string) => string, ns: string, values: readonly string[], keys: readonly string[]): Record<string, string> {
  return Object.fromEntries(values.map((v, i) => [v, t(`forms.health.${ns}.${keys[i]}`)]))
}

function MedikamentForm({ fields, onChange }: { fields: HealthFields; onChange: (f: HealthFields) => void }) {
  const { t } = useTranslation()
  const unitLabels = labelMap(t, 'medUnits', MED_UNITS, MED_UNIT_KEYS)
  const timingLabels = labelMap(t, 'timingOptions', MED_TIMINGS, MED_TIMING_KEYS)

  return (
    <div className="space-y-3">
      <Input
        label={t('forms.health.medNameLabel')}
        value={fields.medName ?? ''}
        onChange={(v) => onChange({ ...fields, medName: v || undefined })}
        placeholder={t('forms.health.medNamePlaceholder')}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">{t('forms.health.dose')}</label>
          <input
            className="input-field"
            type="number"
            min="0"
            step="0.1"
            value={fields.medDose ?? ''}
            onChange={(e) => onChange({ ...fields, medDose: parseFloat(e.target.value) || undefined })}
            placeholder="0"
            style={{ borderRadius: 0 }}
          />
        </div>
        <div>
          <label className="input-label">{t('forms.unit')}</label>
          <PillSelector
            options={MED_UNITS}
            labels={unitLabels}
            value={fields.medUnit ?? ''}
            onChange={(v) => onChange({ ...fields, medUnit: v as string })}
          />
        </div>
      </div>
      <div className="flex items-center justify-between py-1">
        <span className="input-label mb-0">{t('forms.health.prescribed')}</span>
        <button
          type="button"
          onClick={() => onChange({ ...fields, prescribed: !fields.prescribed })}
          className="relative w-12 h-6 rounded-full transition-colors duration-200"
          style={{ background: fields.prescribed ? 'var(--accent-red)' : 'var(--border)' }}
          role="switch"
          aria-checked={fields.prescribed}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
            style={{ transform: fields.prescribed ? 'translateX(26px)' : 'translateX(2px)' }}
          />
        </button>
      </div>
      <div>
        <label className="input-label">{t('forms.health.timing')}</label>
        <PillSelector options={MED_TIMINGS} labels={timingLabels} value={fields.timing ?? ''} onChange={(v) => onChange({ ...fields, timing: v as string })} />
      </div>
    </div>
  )
}

function SymptomForm({ fields, onChange }: { fields: HealthFields; onChange: (f: HealthFields) => void }) {
  const { t } = useTranslation()
  const bodyPartLabels = labelMap(t, 'bodyParts', BODY_PARTS, BODY_PART_KEYS)
  const durationLabels = labelMap(t, 'symptomDurations', SYMPTOM_DURATIONS, SYMPTOM_DURATION_KEYS)

  return (
    <div className="space-y-3">
      <Input
        label={t('forms.health.symptom')}
        value={fields.symptom ?? ''}
        onChange={(v) => onChange({ ...fields, symptom: v || undefined })}
        placeholder={t('forms.health.symptomPlaceholder')}
      />
      <GaugeInput
        label={t('forms.health.severity')}
        value={fields.severity ?? 0}
        onChange={(v) => onChange({ ...fields, severity: v })}
        color="#EC4899"
      />
      <div>
        <label className="input-label">{t('forms.health.bodyPart')}</label>
        <PillSelector options={BODY_PARTS} labels={bodyPartLabels} value={fields.bodyPart ?? ''} onChange={(v) => onChange({ ...fields, bodyPart: v as string })} />
      </div>
      <div>
        <label className="input-label">{t('forms.health.duration')}</label>
        <PillSelector options={SYMPTOM_DURATIONS} labels={durationLabels} value={fields.symptomDuration ?? ''} onChange={(v) => onChange({ ...fields, symptomDuration: v as string })} />
      </div>
    </div>
  )
}

function MessungForm({ fields, onChange }: { fields: HealthFields; onChange: (f: HealthFields) => void }) {
  const { t } = useTranslation()
  const measureTypeLabels = labelMap(t, 'measureTypes', MEASURE_TYPES, MEASURE_TYPE_KEYS)

  return (
    <div className="space-y-3">
      <div>
        <label className="input-label">{t('forms.health.measureTypeLabel')}</label>
        <PillSelector options={MEASURE_TYPES} labels={measureTypeLabels} value={fields.measureType ?? ''} onChange={(v) => onChange({ ...fields, measureType: v as string })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">{t('forms.health.value')}</label>
          <input
            className="input-field"
            type="number"
            step="0.1"
            value={fields.measureValue ?? ''}
            onChange={(e) => onChange({ ...fields, measureValue: parseFloat(e.target.value) || undefined })}
            placeholder="0"
            style={{ borderRadius: 0 }}
          />
        </div>
        <div>
          <label className="input-label">{t('forms.unit')}</label>
          <input
            className="input-field"
            type="text"
            value={fields.measureUnit ?? ''}
            onChange={(e) => onChange({ ...fields, measureUnit: e.target.value || undefined })}
            placeholder="kg, bpm..."
            style={{ borderRadius: 0 }}
          />
        </div>
      </div>
    </div>
  )
}

function SupplementForm({ fields, onChange }: { fields: HealthFields; onChange: (f: HealthFields) => void }) {
  const { t } = useTranslation()
  const timingLabels = labelMap(t, 'timingOptions', SUPP_TIMINGS, SUPP_TIMING_KEYS)

  return (
    <div className="space-y-3">
      <Input
        label={t('forms.health.supplementLabel')}
        value={fields.suppName ?? ''}
        onChange={(v) => onChange({ ...fields, suppName: v || undefined })}
        placeholder={t('forms.health.supplementPlaceholder')}
      />
      <div>
        <label className="input-label">{t('forms.health.dose')}</label>
        <input
          className="input-field"
          type="number"
          min="0"
          step="0.1"
          value={fields.suppDose ?? ''}
          onChange={(e) => onChange({ ...fields, suppDose: parseFloat(e.target.value) || undefined })}
          placeholder="0"
          style={{ borderRadius: 0 }}
        />
      </div>
      <div>
        <label className="input-label">{t('forms.health.timing')}</label>
        <PillSelector
          options={SUPP_TIMINGS}
          labels={timingLabels}
          value={fields.suppTiming ?? ''}
          onChange={(v) => onChange({ ...fields, suppTiming: v as string })}
        />
      </div>
    </div>
  )
}

function EnergieForm({ fields, onChange }: { fields: HealthFields; onChange: (f: HealthFields) => void }) {
  const { t } = useTranslation()
  return (
    <GaugeInput
      label={t('forms.health.energyLevel')}
      value={fields.energy ?? 0}
      onChange={(v) => onChange({ ...fields, energy: v })}
      color="#EC4899"
    />
  )
}

export function HealthForm({ fields, onChange }: HealthFormProps) {
  const { t } = useTranslation()
  const eventTypeLabels = labelMap(t, 'eventTypes', EVENT_TYPES, EVENT_TYPE_KEYS)

  return (
    <div className="space-y-4">
      <div>
        <label className="input-label">{t('forms.health.eventTypeLabel')}</label>
        <div className="grid grid-cols-5 gap-1.5 mt-1">
          {EVENT_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onChange({ ...fields, eventType: type })}
              className="py-2 px-1 rounded-lg text-xs font-semibold transition-all text-center"
              style={{
                border: fields.eventType === type ? '1px solid var(--accent-red)' : '1px solid var(--border)',
                background: fields.eventType === type ? 'var(--accent-red-dim)' : 'var(--bg-elevated)',
                color: fields.eventType === type ? '#F5F5F5' : '#888888',
              }}
            >
              {eventTypeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {fields.eventType === 'Medikament' && <MedikamentForm fields={fields} onChange={onChange} />}
      {fields.eventType === 'Symptom' && <SymptomForm fields={fields} onChange={onChange} />}
      {fields.eventType === 'Messung' && <MessungForm fields={fields} onChange={onChange} />}
      {fields.eventType === 'Supplement' && <SupplementForm fields={fields} onChange={onChange} />}
      {fields.eventType === 'Energie' && <EnergieForm fields={fields} onChange={onChange} />}

      {!fields.eventType && (
        <p className="text-xs text-center py-4" style={{ color: '#444444' }}>
          {t('forms.health.chooseEventType')}
        </p>
      )}
    </div>
  )
}
