import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { BottomSheet } from '@/components/BottomSheet'
import { useGoalsStore } from '@/stores/useGoalsStore'
import { DEFAULT_CATEGORIES } from '@/lib/categories'
import type { CategoryId } from '@/types'
import { hapticSuccess } from '@/lib/haptics'

interface CreateGoalModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateGoalModal({ isOpen, onClose }: CreateGoalModalProps) {
  const { addGoal } = useGoalsStore()

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
      toast.error('Enter a goal title')
      return
    }
    const targetVal = parseFloat(targetValue)
    if (isNaN(targetVal) || targetVal <= 0) {
      toast.error('Enter a valid target value greater than 0')
      return
    }
    const currentVal = parseFloat(currentValue)
    if (isNaN(currentVal) || currentVal < 0) {
      toast.error('Current value must be a positive number')
      return
    }
    if (!unit.trim()) {
      toast.error('Enter a unit of measurement (e.g. km, hr)')
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
    toast.success('Goal created 🏆')
    handleClose()
  }

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="New Goal">
      <div className="px-4 pb-8 flex flex-col gap-5">
        {/* Title */}
        <div>
          <label className="input-label">Goal Title</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Run 100km, Read 5 books…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>

        {/* Category */}
        <div>
          <label className="input-label">Category</label>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`pill text-xs ${category === cat.id ? 'active' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Target and Unit */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="input-label">Target Value</label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 100"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
            />
          </div>
          <div>
            <label className="input-label">Unit</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. km, times"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
        </div>

        {/* Current Value */}
        <div>
          <label className="input-label">Starting Value</label>
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
          <label className="input-label">Deadline (Optional)</label>
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
          Create Goal
        </button>
      </div>
    </BottomSheet>
  )
}
