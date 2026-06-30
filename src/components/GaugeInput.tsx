import { useRef, useEffect, useState, PointerEvent as ReactPointerEvent } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface GaugeInputProps {
  value: number
  onChange: (value: number) => void
  label?: string
  personalGoal?: number
  color?: string
}

export function GaugeInput({ value, onChange, label, personalGoal, color }: GaugeInputProps) {
  const { t } = useTranslation()
  const svgRef = useRef<SVGSVGElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showHint, setShowHint] = useState(() => !localStorage.getItem('lyfe_gauge_hint_seen'))

  // Clamp value between 0 and 10
  const safeValue = Math.min(10, Math.max(0, value))

  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
    if (showHint) {
      setShowHint(false)
      localStorage.setItem('lyfe_gauge_hint_seen', '1')
    }
    updateValueFromEvent(e)
  }

  const handlePointerMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (isDragging) {
      updateValueFromEvent(e)
    }
  }

  const handlePointerUp = (e: ReactPointerEvent<SVGSVGElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setIsDragging(false)
  }

  const updateValueFromEvent = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.bottom - 10
    const x = e.clientX - cx
    const y = e.clientY - cy

    let angle = Math.atan2(y, x)
    if (angle > 0) {
      angle = x < 0 ? -Math.PI : 0
    }

    let newValue = ((angle + Math.PI) / Math.PI) * 10
    newValue = Math.round(Math.max(0, Math.min(10, newValue)))

    if (newValue !== safeValue) {
      onChange(newValue)
    }
  }

  // Calculate needle rotation: -90deg is 0, 90deg is 10
  const rotation = -90 + (safeValue / 10) * 180

  const percentToGoal = personalGoal ? Math.round((safeValue / personalGoal) * 100) : null

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[280px] mx-auto py-2">
      {label && <span className="input-label mb-4 self-start">{label}</span>}

      <div className="relative w-full aspect-[2/1]">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox="0 0 200 120"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="cursor-pointer touch-none"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#EAB308" />
              <stop offset="100%" stopColor="#FF2020" />
            </linearGradient>
          </defs>

          {/* Background track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Colored arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Arc end labels */}
          <text x="12" y="118" textAnchor="middle" fontSize="10" fill="#444444" fontFamily="system-ui, sans-serif">0</text>
          <text x="188" y="118" textAnchor="middle" fontSize="10" fill="#444444" fontFamily="system-ui, sans-serif">10</text>

          {/* Goal marker (optional) */}
          {personalGoal && (
            <line
              x1="100" y1="20" x2="100" y2="4"
              stroke="var(--text-primary)"
              strokeWidth="2"
              transform={`rotate(${-90 + (personalGoal / 10) * 180} 100 100)`}
            />
          )}

          {/* Moving Needle */}
          <motion.g
            initial={false}
            animate={{ rotate: rotation }}
            style={{ originX: '100px', originY: '100px' }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Needle body */}
            <polygon points="98,100 102,100 100,25" fill="var(--text-primary)" />
            {/* Center dot */}
            <circle cx="100" cy="100" r="8" fill="var(--bg-card)" stroke="var(--text-primary)" strokeWidth="3" />
          </motion.g>
        </svg>

        {/* Text inside arc */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pointer-events-none">
          <span className="font-heading font-bold text-4xl text-[#F5F5F5] leading-none mb-1">
            {safeValue}
          </span>
          {personalGoal ? (
            <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider font-semibold">
              {t('gauge.ofGoal', { percent: percentToGoal, goal: personalGoal })}
            </span>
          ) : (
            <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider font-semibold">
              {t('gauge.outOf10')}
            </span>
          )}
        </div>
      </div>

      {/* One-time drag hint */}
      {showHint && (
        <p
          className="text-[10px] font-mono mt-1"
          style={{ color: '#444444', textAlign: 'center' }}
        >
          {t('gauge.dragHint')}
        </p>
      )}
    </div>
  )
}
