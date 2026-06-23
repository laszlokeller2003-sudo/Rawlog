import { motion, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

const springConfig = {
  type: 'spring' as const,
  damping: 32,
  stiffness: 420,
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={springConfig}
          >
            {/* Handle */}
            <div className="sheet-handle" />

            {/* Title & Close Button */}
            <div className="flex items-center justify-between px-4 mb-4 mt-2">
              <h2 className="text-lg font-heading font-bold text-text-primary m-0">
                {title || ''}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-bg-elevated text-text-secondary hover:text-text-primary border border-border"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Content */}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
