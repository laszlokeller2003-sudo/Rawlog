interface RatingSliderProps {
  value: number
  onChange: (v: number) => void
  max?: number
  label?: string
}

export function RatingSlider({ value, onChange, max = 10, label }: RatingSliderProps) {
  const segments = Array.from({ length: max }, (_, i) => i)

  const handleTouch = (e: React.TouchEvent<HTMLDivElement>, container: HTMLDivElement) => {
    const touch = e.changedTouches[0]
    const rect = container.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    const newVal = Math.max(1, Math.round(pct * max))
    onChange(newVal)
  }

  return (
    <div className="w-full">
      {label && (
        <div className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
          {label} · {value}/{max}
        </div>
      )}
      <div
        className="rating-track"
        onTouchEnd={(e) => handleTouch(e, e.currentTarget)}
      >
        {segments.map((i) => (
          <div
            key={i}
            className={`rating-segment ${i < value ? 'filled' : ''}`}
            onClick={() => onChange(i + 1)}
          />
        ))}
      </div>
    </div>
  )
}
