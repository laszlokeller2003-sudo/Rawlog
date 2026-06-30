import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useUIStore } from '@/stores/useUIStore'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { DEFAULT_CATEGORIES, getCategoryById, getCategoryName } from '@/lib/categories'
import { BottomSheet } from '@/components/BottomSheet'
import { PillSelector } from '@/components/PillSelector'
import { Input } from '@/components/Input'
import { hapticSuccess } from '@/lib/haptics'
import type {
  CategoryId,
  EntryFields,
  SubstanceFields,
  IntimacyFields,
  FitnessFields,
  SleepFields,
  MoodFields,
  NutritionFields,
  FinanceFields,
  SocialFields,
  WorkFields,
  HealthFields,
  Currency,
} from '@/types'

// Form imports
import { SubstancesForm } from './forms/SubstancesForm'
import { IntimacyForm } from './forms/IntimacyForm'
import { FitnessForm } from './forms/FitnessForm'
import { SleepForm } from './forms/SleepForm'
import { MoodForm } from './forms/MoodForm'
import { NutritionForm } from './forms/NutritionForm'
import { FinanceForm } from './forms/FinanceForm'
import { SocialForm } from './forms/SocialForm'
import { WorkForm } from './forms/WorkForm'
import { HealthForm } from './forms/HealthForm'

// ─── Default fields per category ─────────────────────────────────────────────

function getDefaultFields(categoryId: CategoryId, currency: Currency): EntryFields {
  switch (categoryId) {
    case 'substances':
      return { unit: 'pieces', quantity: 0, moodBefore: 0, moodAfter: 0 } satisfies SubstanceFields
    case 'intimacy':
      return { rating: 0, partner: '', duration: 0 } satisfies IntimacyFields
    case 'fitness':
      return { intensity: 0, duration: 0 } satisfies FitnessFields
    case 'sleep':
      return { quality: 0, duration: 0, dreams: false } satisfies SleepFields
    case 'mood':
      return { intensity: 0, emoji: '', triggers: [] } satisfies MoodFields
    case 'nutrition':
      return { quality: 0 } satisfies NutritionFields
    case 'finance':
      return { amount: 0, currency, recurring: false } satisfies FinanceFields
    case 'social':
      return { quality: 0, who: '' } satisfies SocialFields
    case 'work':
      return { focusScore: 0, duration: 0 } satisfies WorkFields
    case 'health':
      return { severity: 0, bodyPart: '' } satisfies HealthFields
    default:
      return {}
  }
}

// ─── Form renderer ───────────────────────────────────────────────────────────

function CategoryForm({
  categoryId,
  subcategory,
  fields,
  onChange,
}: {
  categoryId: CategoryId
  subcategory: string
  fields: EntryFields
  onChange: (f: EntryFields) => void
}) {
  switch (categoryId) {
    case 'substances':
      return (
        <SubstancesForm
          subcategory={subcategory}
          fields={fields as SubstanceFields}
          onChange={(f) => onChange(f)}
        />
      )
    case 'intimacy':
      return (
        <IntimacyForm
          subcategory={subcategory}
          fields={fields as IntimacyFields}
          onChange={(f) => onChange(f)}
        />
      )
    case 'fitness':
      return (
        <FitnessForm
          fields={fields as FitnessFields}
          onChange={(f) => onChange(f)}
        />
      )
    case 'sleep':
      return (
        <SleepForm
          fields={fields as SleepFields}
          onChange={(f) => onChange(f)}
        />
      )
    case 'mood':
      return (
        <MoodForm
          fields={fields as MoodFields}
          onChange={(f) => onChange(f)}
        />
      )
    case 'nutrition':
      return (
        <NutritionForm
          fields={fields as NutritionFields}
          onChange={(f) => onChange(f)}
        />
      )
    case 'finance':
      return (
        <FinanceForm
          subcategory={subcategory}
          fields={fields as FinanceFields}
          onChange={(f) => onChange(f)}
        />
      )
    case 'social':
      return (
        <SocialForm
          fields={fields as SocialFields}
          onChange={(f) => onChange(f)}
        />
      )
    case 'work':
      return (
        <WorkForm
          fields={fields as WorkFields}
          onChange={(f) => onChange(f)}
        />
      )
    case 'health':
      return (
        <HealthForm
          fields={fields as HealthFields}
          onChange={(f) => onChange(f)}
        />
      )
    default:
      return null
  }
}

// ─── EntryBottomSheet ─────────────────────────────────────────────────────────

export function EntryBottomSheet() {
  const { t } = useTranslation()
  const { isEntrySheetOpen, activeEntryCategory, closeEntrySheet } = useUIStore()
  const { addEntry } = useEntriesStore()
  const { profile } = useProfileStore()

  const category = activeEntryCategory
    ? getCategoryById(activeEntryCategory, DEFAULT_CATEGORIES)
    : null

  const [subcategory, setSubcategory] = useState<string>('')
  const [fields, setFields] = useState<EntryFields>({})
  const [note, setNote] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [useCustomTime, setUseCustomTime] = useState(false)
  const [customTime, setCustomTime] = useState('')

  // Reset state when opening a new category or closing
  useEffect(() => {
    if (activeEntryCategory && isEntrySheetOpen) {
      setSubcategory('') // Selected subcategory: nothing selected
      setFields(getDefaultFields(activeEntryCategory, profile.currency))
      setNote('')
      setTagsInput('')
      setUseCustomTime(false)
      setCustomTime('')
    } else if (!isEntrySheetOpen) {
      setSubcategory('')
      setFields({})
      setNote('')
      setTagsInput('')
      setUseCustomTime(false)
      setCustomTime('')
    }
  }, [activeEntryCategory, isEntrySheetOpen, profile.currency])

  if (!category || !activeEntryCategory) return null

  const parsedTags = tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const handleSave = () => {
    if (!subcategory) {
      toast.error(t('entry.selectSubcategory'))
      return
    }

    const timestamp = useCustomTime && customTime
      ? new Date(customTime).toISOString()
      : new Date().toISOString()

    addEntry({
      category: activeEntryCategory,
      subcategory,
      fields,
      note: note.trim() || undefined,
      timestamp,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    })

    toast.success(t('entry.saved'), {
      style: {
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border)',
      },
    })

    hapticSuccess()
    closeEntrySheet()
  }

  return (
    <BottomSheet isOpen={isEntrySheetOpen} onClose={closeEntrySheet}>
      {/* Category header */}
      <div className="px-4 pb-3 flex items-center gap-3">
        <span className="text-2xl leading-none">
          {category.id === 'fitness' ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 10L6 8L16 18L14 20L4 10Z" fill={category.color}/>
              <path d="M7 5L9 3L11 5L9 7L7 5Z" fill={category.color}/>
              <path d="M13 19L15 17L17 19L15 21L13 19Z" fill={category.color}/>
              <path d="M2 12L4 10L6 12L4 14L2 12Z" fill={category.color}/>
              <path d="M18 20L20 18L22 20L20 22L18 20Z" fill={category.color}/>
            </svg>
          ) : (
            category.icon
          )}
        </span>
        <span
          className="font-heading font-bold text-lg"
          style={{ color: category.color }}
        >
          {getCategoryName(category, profile.language)}
        </span>
      </div>

      {/* Subcategory selector */}
      <div className="px-4 pb-4">
        <label className="input-label">{t('entry.type')}</label>
        <PillSelector
          options={category.subcategories}
          value={subcategory}
          onChange={(v) => setSubcategory(v as string)}
        />
      </div>

      <div className="divider mx-4" style={{ margin: '0 16px 16px' }} />

      {/* Category-specific form */}
      <div className="px-4 pb-2">
        <CategoryForm
          categoryId={activeEntryCategory}
          subcategory={subcategory}
          fields={fields}
          onChange={setFields}
        />
      </div>

      <div className="divider mx-4" style={{ margin: '16px 16px' }} />

      {/* Timestamp row */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between">
          <span className="input-label mb-0">{t('entry.time')}</span>
          {!useCustomTime ? (
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() => {
                setUseCustomTime(true)
                const now = new Date()
                const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
                  .toISOString()
                  .slice(0, 16)
                setCustomTime(local)
              }}
            >
              {t('entry.nowChange')}
            </button>
          ) : (
            <input
              type="datetime-local"
              className="input-field text-sm"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              style={{ borderRadius: 0, width: 'auto' }}
            />
          )}
        </div>
      </div>

      {/* Tags input */}
      <div className="px-4 pb-3">
        <Input
          label={t('entry.tags')}
          value={tagsInput}
          onChange={setTagsInput}
          placeholder={t('entry.tagsPlaceholder')}
        />
        {parsedTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {parsedTags.map((tag) => (
              <span key={tag} className="pill text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Note */}
      <div className="px-4 pb-4">
        <Input
          label={t('entry.note')}
          value={note}
          onChange={setNote}
          placeholder={t('entry.notePlaceholder')}
          multiline
          rows={2}
        />
      </div>

      {/* Save button */}
      <div className="pb-safe">
        <button
          type="button"
          className="btn-primary"
          onClick={handleSave}
        >
          {t('entry.save')}
        </button>
      </div>
    </BottomSheet>
  )
}
