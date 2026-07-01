import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/BottomSheet'
import { PillSelector } from '@/components/PillSelector'
import { useHabitsStore } from '@/stores/useHabitsStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { DEFAULT_CATEGORIES, getCategoryName } from '@/lib/categories'
import type { CategoryId, HabitFrequency } from '@/types'
import { hapticSuccess } from '@/lib/haptics'

const FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Custom']
// Days of week: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0]

interface CreateHabitModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateHabitModal({ isOpen, onClose }: CreateHabitModalProps) {
  const { t } = useTranslation()
  const { addHabit } = useHabitsStore()
  const { profile } = useProfileStore()
  const FREQUENCY_LABELS: Record<string, string> = {
    Daily: t('habits.frequencyDaily'),
    Weekly: t('habits.frequencyWeekly'),
    Custom: t('habits.frequencyCustom'),
  }
  const DAY_LABELS = t('habits.dayLabels', { returnObjects: true }) as string[]

  const [name, setName] = useState('')
  const [category, setCategory] = useState<CategoryId>('fitness')
  const [frequencyOption, setFrequencyOption] = useState('Daily')
  const [customDays, setCustomDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [graceperiod, setGraceperiod] = useState(false)

  const handleClose = () => {
    setName('')
    setCategory('fitness')
    setFrequencyOption('Daily')
    setCustomDays([1, 2, 3, 4, 5])
    setGraceperiod(false)
    onClose()
  }

  const toggleDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(t('habits.errorEnterHabitName'))
      return
    }

    let frequency: HabitFrequency
    if (frequencyOption === 'Daily') {
      frequency = 'daily'
    } else if (frequencyOption === 'Weekly') {
      frequency = 'weekly'
    } else {
      if (customDays.length === 0) {
        toast.error(t('habits.errorSelectDay'))
        return
      }
      frequency = customDays
    }

    addHabit({
      name: name.trim(),
      category,
      frequency,
      graceperiod,
      enabled: true,
    })

    hapticSuccess()
    toast.success(t('habits.habitCreatedToast'))
    handleClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={t('habits.newHabit')}>
      <div className="px-4 pb-8 flex flex-col gap-5">
        {/* Name */}
        <div>
          <label className="input-label">{t('habits.habitName')}</label>
          <input
            type="text"
            className="input-field"
            placeholder={t('habits.habitNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        {/* Category */}
        <div>
          <label className="input-label">{t('habits.category')}</label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`pill text-xs ${category === cat.id ? 'active' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.icon} {getCategoryName(cat, profile.language)}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency */}
        <div>
          <label className="input-label">{t('habits.frequency')}</label>
          <PillSelector
            options={FREQUENCY_OPTIONS}
            labels={FREQUENCY_LABELS}
            value={frequencyOption}
            onChange={(v) => setFrequencyOption(v as string)}
          />
        </div>

        {/* Custom day picker */}
        {frequencyOption === 'Custom' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="input-label">{t('habits.daysOfWeek')}</label>
            <div className="flex gap-2 mt-1">
              {DAY_LABELS.map((label, i) => {
                const dayVal = DAY_VALUES[i]
                const isActive = customDays.includes(dayVal)
                return (
                  <button
                    key={`${label}-${i}`}
                    type="button"
                    className={`flex-1 py-2 text-sm font-heading font-bold rounded-md border transition-all duration-150 ${
                      isActive
                        ? 'bg-accent-red-dim border-accent-red text-accent-red'
                        : 'bg-bg-elevated border-border text-text-muted'
                    }`}
                    onClick={() => toggleDay(dayVal)}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Grace period toggle */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm text-text-primary font-medium">{t('habits.gracePeriodTitle')}</p>
            <p className="text-xs text-text-secondary mt-0.5">
              {t('habits.gracePeriodDesc')}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={graceperiod}
            className={`w-11 h-6 rounded-full border transition-all duration-200 relative ${
              graceperiod ? 'bg-accent-red border-accent-red' : 'bg-bg-elevated border-border'
            }`}
            onClick={() => setGraceperiod((v) => !v)}
          >
            <motion.div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white"
              animate={{ left: graceperiod ? '22px' : '2px' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        {/* Save button */}
        <button className="btn-primary" onClick={handleSave}>
          {t('habits.createHabitBtn')}
        </button>
      </div>
    </BottomSheet>
  )
}
