import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { BottomSheet } from '@/components/BottomSheet'
import { useGoalsStore } from '@/stores/useGoalsStore'
import { useProfileStore } from '@/stores/useProfileStore'
import { DEFAULT_CATEGORIES, getCategoryName } from '@/lib/categories'
import type { CategoryId } from '@/types'
import { hapticSuccess } from '@/lib/haptics'

interface CreateGoalModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateGoalModal({ isOpen, onClose }: CreateGoalModalProps) {
  const { t } = useTranslation()
  const { addGoal } = useGoalsStore()
  const { profile } = useProfileStore()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<CategoryId>('fitness')
  const [targetValue, setTargetValue] = useState('')
  const [currentValue, setCurrentValue] = useState('0')
  const [unit, setUnit] = useState('')
  const [deadline, setDeadline] = useState('')

  const handleClose = () => {
    setTitle('')
    setCategory('fitness')
    setTargetValue('')
    setCurrentValue('0')
    setUnit('')
    setDeadline('')
    onClose()
  }

  const handleSave = () => {
    if (!title.trim()) {
      toast.error(t('habits.errorEnterGoalTitle'))
      return
    }
    const targetVal = parseFloat(targetValue)
    if (isNaN(targetVal) || targetVal <= 0) {
      toast.error(t('habits.errorTargetValue'))
      return
    }
    const currentVal = parseFloat(currentValue)
    if (isNaN(currentVal) || currentVal < 0) {
      toast.error(t('habits.errorCurrentValue'))
      return
    }
    if (!unit.trim()) {
      toast.error(t('habits.errorUnit'))
      return
    }

    addGoal({
      title: title.trim(),
      category,
      targetValue: targetVal,
      currentValue: currentVal,
      unit: unit.trim(),
      deadline: deadline || undefined,
    })

    hapticSuccess()
    toast.success(t('habits.goalCreatedToast'))
    handleClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title={t('habits.newGoal')}>
      <div className="px-4 pb-8 flex flex-col gap-5">
        {/* Title */}
        <div>
          <label className="input-label">{t('habits.goalTitle')}</label>
          <input
            type="text"
            className="input-field"
            placeholder={t('habits.goalTitlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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

        {/* Target and Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">{t('habits.targetValue')}</label>
            <input
              type="number"
              className="input-field"
              placeholder={t('habits.targetValuePlaceholder')}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">{t('habits.unit')}</label>
            <input
              type="text"
              className="input-field"
              placeholder={t('habits.unitPlaceholder')}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
        </div>

        {/* Current Value */}
        <div>
          <label className="input-label">{t('habits.startingValue')}</label>
          <input
            type="number"
            className="input-field"
            placeholder="0"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="input-label">{t('habits.deadlineOptional')}</label>
          <input
            type="date"
            className="input-field"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* Save button */}
        <button className="btn-primary mt-2" onClick={handleSave}>
          {t('habits.createGoalBtn')}
        </button>
      </div>
    </BottomSheet>
  )
}
