import type { HealthFields, HealthEventType } from '@/types'
import { GaugeInput } from '@/components/GaugeInput'
import { PillSelector } from '@/components/PillSelector'
import { Input } from '@/components/Input'

interface HealthFormProps {
  fields: HealthFields
  onChange: (f: HealthFields) => void
}

const EVENT_TYPES: HealthEventType[] = ['Medikament', 'Symptom', 'Messung', 'Supplement', 'Energie']
const MED_UNITS = ['mg', 'ml', 'Tabletten', 'Tropfen', 'Sprühstöße']
const MED_TIMINGS = ['Morgens', 'Mittags', 'Abends', 'Nachts', 'Bei Bedarf']
const BODY_PARTS = ['Kopf', 'Bauch', 'Rücken', 'Brust', 'Kehle', 'Gelenke', 'Muskeln', 'Sonstiges']
const SYMPTOM_DURATIONS = ['Kurz (<1h)', 'Stunden', 'Tag', 'Mehrere Tage']
const MEASURE_TYPES = ['Gewicht', 'Blutdruck', 'Puls', 'Blutzucker', 'Temperatur', 'Andere']
const SUPP_TIMINGS = ['Morgens', 'Mittags', 'Abends', 'Pre-Workout', 'Post-Workout', 'Vor dem Schlafen']

function MedikamentForm({ fields, onChange }: { fields: HealthFields; onChange: (f: HealthFields) => void }) {
  return (
    <div className="space-y-3">
      <Input
        label="Medikament / Wirkstoff"
        value={fields.medName ?? ''}
        onChange={(v) => onChange({ ...fields, medName: v || undefined })}
        placeholder="z.B. Ibuprofen, Aspirin..."
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">Dosis</label>
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
          <label className="input-label">Einheit</label>
          <PillSelector
            options={MED_UNITS}
            value={fields.medUnit ?? ''}
            onChange={(v) => onChange({ ...fields, medUnit: v as string })}
          />
        </div>
      </div>
      <div className="flex items-center justify-between py-1">
        <span className="input-label mb-0">Verschrieben</span>
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
        <label className="input-label">Zeitpunkt</label>
        <PillSelector options={MED_TIMINGS} value={fields.timing ?? ''} onChange={(v) => onChange({ ...fields, timing: v as string })} />
      </div>
    </div>
  )
}

function SymptomForm({ fields, onChange }: { fields: HealthFields; onChange: (f: HealthFields) => void }) {
  return (
    <div className="space-y-3">
      <Input
        label="Symptom"
        value={fields.symptom ?? ''}
        onChange={(v) => onChange({ ...fields, symptom: v || undefined })}
        placeholder="z.B. Kopfschmerzen, Husten..."
      />
      <GaugeInput
        label="Schweregrad"
        value={fields.severity ?? 0}
        onChange={(v) => onChange({ ...fields, severity: v })}
        color="#EC4899"
      />
      <div>
        <label className="input-label">Körperstelle</label>
        <PillSelector options={BODY_PARTS} value={fields.bodyPart ?? ''} onChange={(v) => onChange({ ...fields, bodyPart: v as string })} />
      </div>
      <div>
        <label className="input-label">Dauer</label>
        <PillSelector options={SYMPTOM_DURATIONS} value={fields.symptomDuration ?? ''} onChange={(v) => onChange({ ...fields, symptomDuration: v as string })} />
      </div>
    </div>
  )
}

function MessungForm({ fields, onChange }: { fields: HealthFields; onChange: (f: HealthFields) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="input-label">Art der Messung</label>
        <PillSelector options={MEASURE_TYPES} value={fields.measureType ?? ''} onChange={(v) => onChange({ ...fields, measureType: v as string })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">Wert</label>
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
          <label className="input-label">Einheit</label>
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
  return (
    <div className="space-y-3">
      <Input
        label="Supplement"
        value={fields.suppName ?? ''}
        onChange={(v) => onChange({ ...fields, suppName: v || undefined })}
        placeholder="z.B. Vitamin D, Omega-3, Kreatin..."
      />
      <div>
        <label className="input-label">Dosis</label>
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
        <label className="input-label">Zeitpunkt</label>
        <PillSelector options={SUPP_TIMINGS} value={fields.suppTiming ?? ''} onChange={(v) => onChange({ ...fields, suppTiming: v as string })} />
      </div>
    </div>
  )
}

function EnergieForm({ fields, onChange }: { fields: HealthFields; onChange: (f: HealthFields) => void }) {
  return (
    <GaugeInput
      label="Energielevel"
      value={fields.energy ?? 0}
      onChange={(v) => onChange({ ...fields, energy: v })}
      color="#EC4899"
    />
  )
}

export function HealthForm({ fields, onChange }: HealthFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="input-label">Art des Eintrags</label>
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
              {type}
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
          Wähle eine Art des Eintrags oben
        </p>
      )}
    </div>
  )
}
