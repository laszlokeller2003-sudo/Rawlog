import { cn } from '@/lib/utils'

interface PillSelectorProps {
  options: string[]
  value: string | string[]
  onChange: (v: string | string[]) => void
  multi?: boolean
}

export function PillSelector({ options, value, onChange, multi = false }: PillSelectorProps) {
  const isActive = (option: string): boolean => {
    if (multi) {
      return Array.isArray(value) && value.includes(option)
    }
    return value === option
  }

  const handleClick = (option: string) => {
    if (multi) {
      const arr = Array.isArray(value) ? value : []
      if (arr.includes(option)) {
        onChange(arr.filter((v) => v !== option))
      } else {
        onChange([...arr, option])
      }
    } else {
      onChange(option)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={cn('pill', isActive(option) && 'active')}
          onClick={() => handleClick(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
