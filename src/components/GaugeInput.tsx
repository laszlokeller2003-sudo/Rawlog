import { useRef, useEffect, useState, PointerEvent as ReactPointerEvent } from 'react'
import { motion } from 'framer-motion'

interface GaugeInputProps {
  value: number
  onChange: (value: number) => void
  label?: string
  personalGoal?: number
  color?: string
}

export function GaugeInput({ value, onChange, label, personalGoal, color }: GaugeInputProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Clamp value between 0 and 10
  const safeValue = Math.min(10, Math.max(0, value))

  const handlePointerDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDragging(true)
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
    // Center is bottom-middle of the SVG viewbox (since it's a semicircle)
    const cx = rect.left + rect.width / 2
    const cy = rect.bottom - 10 // approx center Y relative to bottom padding
    const x = e.clientX - cx
    const y = e.clientY - cy

    // Calculate angle in radians: Math.atan2(y, x)
    // -PI is left (0), -PI/2 is top (5), 0 is right (10)
    let angle = Math.atan2(y, x)
    if (angle > 0) {
      // If below the arc, clamp to edges
      angle = x < 0 ? -Math.PI : 0
    }

    // Map angle from [-PI, 0] to [0, 10]
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
              {percentToGoal}% of goal {personalGoal}
            </span>
          ) : (
            <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider font-semibold">
              / 10
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
