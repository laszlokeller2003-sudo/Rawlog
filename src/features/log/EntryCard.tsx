import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { Entry } from '@/types'
import { DEFAULT_CATEGORIES } from '@/lib/categories'
import { useEntriesStore } from '@/stores/useEntriesStore'
import { truncate } from '@/lib/utils'

interface EntryCardProps {
  entry: Entry
  onEdit?: () => void
  onDelete?: () => void
}

export function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const { t } = useTranslation()
  const [showActions, setShowActions] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const deleteEntry = useEntriesStore((s) => s.deleteEntry)

  const category = DEFAULT_CATEGORIES.find((c) => c.id === entry.category)
  const color = category?.color ?? '#888888'

  const time = new Date(entry.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      setShowActions(true)
    }, 500)
  }

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete()
    } else {
      deleteEntry(entry.id)
    }
    setShowActions(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.15 }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="px-4 py-3 border-b select-none"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3">
        {/* Category color dot */}
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: color }}
        />

        {/* Subcategory name */}
        <span className="flex-1 font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
          {entry.subcategory}
        </span>

        {/* Time */}
        <span className="font-mono text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          {time}
        </span>
      </div>

      {/* Note preview */}
      {entry.note && (
        <div
          className="ml-5 mt-1 text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          {truncate(entry.note, 50)}
        </div>
      )}

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="ml-5 mt-2 flex flex-wrap gap-1">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Long press action buttons */}
      {showActions && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 ml-5 flex gap-2"
        >
          {onEdit && (
            <button
              type="button"
              className="btn-ghost text-xs py-1 px-2"
              onClick={() => { onEdit(); setShowActions(false) }}
            >
              {t('common.edit')}
            </button>
          )}
          <button
            type="button"
            className="btn-ghost text-xs py-1 px-2"
            style={{ color: 'var(--accent-red)' }}
            onClick={handleDelete}
          >
            {t('common.delete')}
          </button>
          <button
            type="button"
            className="btn-ghost text-xs py-1 px-2"
            onClick={() => setShowActions(false)}
          >
            {t('common.cancel')}
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
