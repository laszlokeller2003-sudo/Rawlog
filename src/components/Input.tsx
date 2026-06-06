import { cn } from '@/lib/utils'

interface InputProps {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  multiline?: boolean
  rows?: number
  className?: string
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  multiline = false,
  rows = 3,
  className,
}: InputProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && <label className="input-label">{label}</label>}
      {multiline ? (
        <textarea
          className="input-field resize-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={{ borderRadius: 0 }}
        />
      ) : (
        <input
          className="input-field"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ borderRadius: 0 }}
        />
      )}
    </div>
  )
}
