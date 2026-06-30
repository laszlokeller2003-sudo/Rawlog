import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { SubstanceFields } from '@/types'
import { RatingSlider } from '@/components/RatingSlider'
import { PillSelector } from '@/components/PillSelector'
import { Input } from '@/components/Input'

interface SubstancesFormProps {
  subcategory: string
  fields: SubstanceFields
  onChange: (f: SubstanceFields) => void
}

const JOINT_SIZES = ['Klein', 'Mittel', 'Groß', 'XL']
const JOINT_CONTENTS = ['Nur Gras', 'Mix', 'Nur Tabak']
const BLUETEN_METHODS = ['Bong', 'Vape', 'Pfeife', 'Edible']
const ALCOHOL_TYPES = ['Bier', 'Wein', 'Spirits', 'Cocktail', 'Shot', 'Sekt'] as const
const ALCOHOL_VOLUMES = [40, 150, 330, 500]
const COFFEE_TYPES = ['Espresso', 'Filter', 'Cappuccino', 'Latte', 'Cold Brew'] as const

// Auto % mapping for alcohol
const ALCOHOL_PERCENTAGES: Record<string, number> = {
  Bier: 5,
  Wein: 12,
  Spirits: 40,
  Cocktail: 15,
  Shot: 40,
  Sekt: 11,
}

// Auto caffeine mapping for coffee
const COFFEE_CAFFEINE: Record<string, number> = {
  Espresso: 63,
  Filter: 95,
  Cappuccino: 63,
  Latte: 63,
  'Cold Brew': 150,
}

export function SubstancesForm({ subcategory, fields, onChange }: SubstancesFormProps) {
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)

  // Auto standard drinks calculation
  useEffect(() => {
    if (subcategory === 'Alkohol' && fields.ml && fields.percentage) {
      const std = (fields.ml * fields.percentage) / 1000 / 0.8
      if (fields.standardDrinks !== std) {
        onChange({ ...fields, standardDrinks: parseFloat(std.toFixed(1)) })
      }
    }
  }, [subcategory, fields.ml, fields.percentage, fields.standardDrinks, onChange])

  // Auto caffeine calculation
  useEffect(() => {
    if (subcategory === 'Kaffee' && fields.coffeeType) {
      const defaultCaf = COFFEE_CAFFEINE[fields.coffeeType] || 0
      if (fields.caffeineMg !== defaultCaf) {
        onChange({ ...fields, caffeineMg: defaultCaf })
      }
    }
  }, [subcategory, fields.coffeeType, fields.caffeineMg, onChange])

  const renderGeneric = () => (
    <div className="space-y-4">
      <div>
        <label className="input-label">Quantity</label>
        <div className="flex gap-2 items-start">
          <input
            className="input-field flex-1"
            type="number"
            min="0"
            step="0.1"
            value={fields.quantity ?? ''}
            onChange={(e) => onChange({ ...fields, quantity: parseFloat(e.target.value) || undefined })}
            placeholder="0"
          />
          <PillSelector
            options={['pieces', 'ml', 'mg']}
            value={fields.unit ?? 'pieces'}
            onChange={(v) => onChange({ ...fields, unit: v as string })}
          />
        </div>
      </div>
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
          <RatingSlider label="Mood before" value={fields.moodBefore ?? 0} onChange={(v) => onChange({ ...fields, moodBefore: v })} />
          <RatingSlider label="Mood after" value={fields.moodAfter ?? 0} onChange={(v) => onChange({ ...fields, moodAfter: v })} />
        </>
      )}
    </div>
  )

  if (!subcategory) return renderGeneric()

  if (subcategory === 'Joint') {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="input-label">Count</label>
            <input className="input-field" type="number" min="1" step="1" value={fields.count ?? ''} onChange={(e) => onChange({ ...fields, count: parseInt(e.target.value) || undefined })} placeholder="1" />
          </div>
          <div className="flex-1">
            <label className="input-label">Grams</label>
            <input className="input-field" type="number" min="0" step="0.1" value={fields.grams ?? ''} onChange={(e) => onChange({ ...fields, grams: parseFloat(e.target.value) || undefined })} placeholder="0.5" />
          </div>
        </div>
        <div>
          <label className="input-label">Size</label>
          <PillSelector options={JOINT_SIZES} value={fields.size ?? ''} onChange={(v) => onChange({ ...fields, size: v as any })} />
        </div>
        <div>
          <label className="input-label">Content</label>
          <PillSelector options={JOINT_CONTENTS} value={fields.content ?? ''} onChange={(v) => onChange({ ...fields, content: v as any })} />
        </div>
        
        <button type="button" className="btn-ghost text-xs w-full flex items-center justify-center gap-1" onClick={() => setShowMore(!showMore)}>
          <span>{showMore ? '▲' : '▼'}</span>
          <span>{showMore ? 'Less details' : 'More details'}</span>
        </button>
        {showMore && (
          <>
            <div className="divider" />
            <Input label="Strain (optional)" value={fields.strain ?? ''} onChange={(v) => onChange({ ...fields, strain: v })} placeholder="e.g. Lemon Haze" />
            <Input label="With whom? (comma separated)" value={fields.with?.join(', ') ?? ''} onChange={(v) => onChange({ ...fields, with: v.split(',').map((s: string) => s.trim()).filter(Boolean) })} placeholder="e.g. Alex, Sarah" />
            <RatingSlider label="Mood before" value={fields.moodBefore ?? 0} onChange={(v) => onChange({ ...fields, moodBefore: v })} />
            <RatingSlider label="Mood after" value={fields.moodAfter ?? 0} onChange={(v) => onChange({ ...fields, moodAfter: v })} />
          </>
        )}
      </div>
    )
  }

  if (subcategory === 'Blüten') {
    return (
      <div className="space-y-4">
        <div>
          <label className="input-label">Grams</label>
          <input className="input-field" type="number" min="0" step="0.1" value={fields.grams ?? ''} onChange={(e) => onChange({ ...fields, grams: parseFloat(e.target.value) || undefined })} placeholder="0.5" />
        </div>
        <div>
          <label className="input-label">Method</label>
          <PillSelector options={BLUETEN_METHODS} value={fields.method ?? ''} onChange={(v) => onChange({ ...fields, method: v as any })} />
        </div>
        
        <button type="button" className="btn-ghost text-xs w-full flex items-center justify-center gap-1" onClick={() => setShowMore(!showMore)}>
          <span>{showMore ? '▲' : '▼'}</span>
          <span>{showMore ? 'Less details' : 'More details'}</span>
        </button>
        {showMore && (
          <>
            <div className="divider" />
            <Input label="Strain" value={fields.strain ?? ''} onChange={(v) => onChange({ ...fields, strain: v })} placeholder="e.g. Amnesia" />
            <RatingSlider label="Mood before" value={fields.moodBefore ?? 0} onChange={(v) => onChange({ ...fields, moodBefore: v })} />
            <RatingSlider label="Mood after" value={fields.moodAfter ?? 0} onChange={(v) => onChange({ ...fields, moodAfter: v })} />
          </>
        )}
      </div>
    )
  }

  if (subcategory === 'Zigarette') {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="input-label">Count</label>
            <input className="input-field" type="number" min="1" step="1" value={fields.count ?? ''} onChange={(e) => onChange({ ...fields, count: parseInt(e.target.value) || undefined })} placeholder="1" />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input type="checkbox" checked={fields.selfRolled ?? false} onChange={(e) => onChange({ ...fields, selfRolled: e.target.checked })} />
            Self-rolled
          </label>
        </div>
        
        <button type="button" className="btn-ghost text-xs w-full flex items-center justify-center gap-1" onClick={() => setShowMore(!showMore)}>
          <span>{showMore ? '▲' : '▼'}</span>
          <span>{showMore ? 'Less details' : 'More details'}</span>
        </button>
        {showMore && (
          <>
            <div className="divider" />
            <Input label={t('entry.brand')} value={fields.brand ?? ''} onChange={(v) => onChange({ ...fields, brand: v })} placeholder="e.g. Marlboro" />
            <RatingSlider label="Mood before" value={fields.moodBefore ?? 0} onChange={(v) => onChange({ ...fields, moodBefore: v })} />
          </>
        )}
      </div>
    )
  }

  if (subcategory === 'Alkohol') {
    return (
      <div className="space-y-4">
        <div>
          <label className="input-label">Type</label>
          <PillSelector
            options={[...ALCOHOL_TYPES]}
            value={fields.alcoholType ?? ''}
            onChange={(v) => {
              const t = v as any
              onChange({ ...fields, alcoholType: t, percentage: ALCOHOL_PERCENTAGES[t] || fields.percentage })
            }}
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="input-label">Volume (ml)</label>
            <input className="input-field" type="number" min="0" step="1" value={fields.ml ?? ''} onChange={(e) => onChange({ ...fields, ml: parseInt(e.target.value) || undefined })} placeholder="330" />
            <div className="flex gap-1 mt-1">
              {ALCOHOL_VOLUMES.map((vol) => (
                <button key={vol} type="button" className="px-2 py-0.5 text-[10px] bg-bg-elevated border border-border rounded" onClick={() => onChange({ ...fields, ml: vol })}>
                  {vol}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1">
            <label className="input-label">Alcohol %</label>
            <input className="input-field" type="number" min="0" max="100" step="0.1" value={fields.percentage ?? ''} onChange={(e) => onChange({ ...fields, percentage: parseFloat(e.target.value) || undefined })} placeholder="5.0" />
          </div>
        </div>

        {fields.standardDrinks !== undefined && (
          <div className="text-xs text-text-muted font-mono bg-bg-elevated p-2 rounded text-center border border-border">
            Standard Drinks: <span className="font-bold text-accent-red">{fields.standardDrinks}</span>
          </div>
        )}

        <button type="button" className="btn-ghost text-xs w-full flex items-center justify-center gap-1" onClick={() => setShowMore(!showMore)}>
          <span>{showMore ? '▲' : '▼'}</span>
          <span>{showMore ? 'Less details' : 'More details'}</span>
        </button>
        {showMore && (
          <>
            <div className="divider" />
            <RatingSlider label="Mood before" value={fields.moodBefore ?? 0} onChange={(v) => onChange({ ...fields, moodBefore: v })} />
            <RatingSlider label="Mood after" value={fields.moodAfter ?? 0} onChange={(v) => onChange({ ...fields, moodAfter: v })} />
          </>
        )}
      </div>
    )
  }

  if (subcategory === 'Kaffee') {
    return (
      <div className="space-y-4">
        <div>
          <label className="input-label">Type</label>
          <PillSelector options={[...COFFEE_TYPES]} value={fields.coffeeType ?? ''} onChange={(v) => onChange({ ...fields, coffeeType: v as any })} />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="input-label">Count (cups)</label>
            <input className="input-field" type="number" min="1" step="1" value={fields.count ?? ''} onChange={(e) => onChange({ ...fields, count: parseInt(e.target.value) || undefined })} placeholder="1" />
          </div>
          <div className="flex-1">
            <label className="input-label">Or ml</label>
            <input className="input-field" type="number" min="0" step="1" value={fields.ml ?? ''} onChange={(e) => onChange({ ...fields, ml: parseInt(e.target.value) || undefined })} placeholder="250" />
          </div>
        </div>

        {fields.caffeineMg !== undefined && (
          <div className="text-xs text-text-muted font-mono bg-bg-elevated p-2 rounded text-center border border-border">
            Est. Caffeine: <span className="font-bold text-accent-red">{fields.caffeineMg}mg</span>
          </div>
        )}
      </div>
    )
  }

  if (subcategory === 'Energy Drink') {
    return (
      <div className="space-y-4">
        <Input label={t('entry.brand')} value={fields.brand ?? ''} onChange={(v) => onChange({ ...fields, brand: v })} placeholder="e.g. Red Bull" />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="input-label">Size (ml)</label>
            <input className="input-field" type="number" min="0" step="1" value={fields.ml ?? ''} onChange={(e) => onChange({ ...fields, ml: parseInt(e.target.value) || undefined })} placeholder="250" />
          </div>
          <div className="flex-1">
            <label className="input-label">Caffeine (mg)</label>
            <input className="input-field" type="number" min="0" step="1" value={fields.caffeineMg ?? ''} onChange={(e) => onChange({ ...fields, caffeineMg: parseInt(e.target.value) || undefined })} placeholder="80" />
          </div>
        </div>
      </div>
    )
  }

  if (subcategory === 'Medikament') {
    return (
      <div className="space-y-4">
        <Input label="Name" value={fields.name ?? ''} onChange={(v) => onChange({ ...fields, name: v })} placeholder="e.g. Ibuprofen" />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="input-label">Dose</label>
            <input className="input-field" type="number" min="0" step="0.1" value={fields.dose ?? ''} onChange={(e) => onChange({ ...fields, dose: parseFloat(e.target.value) || undefined })} placeholder="400" />
          </div>
          <div className="flex-1">
            <label className="input-label">Unit</label>
            <input className="input-field" type="text" value={fields.unit ?? ''} onChange={(e) => onChange({ ...fields, unit: e.target.value })} placeholder="mg" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-text-primary">
            <input type="checkbox" checked={fields.prescribed ?? false} onChange={(e) => onChange({ ...fields, prescribed: e.target.checked })} />
            Prescribed
          </label>
          <div className="flex items-center gap-2 w-1/2">
            <label className="text-xs text-text-muted">Timing</label>
            <input className="input-field w-full" type="text" value={fields.timing ?? ''} onChange={(e) => onChange({ ...fields, timing: e.target.value })} placeholder="Morning" />
          </div>
        </div>
      </div>
    )
  }

  return renderGeneric()
}
