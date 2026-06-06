import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  fullWidth?: boolean
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  type?: 'button' | 'submit'
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'py-2 px-3 text-sm',
  md: 'py-3 px-5 text-sm',
  lg: 'py-4 px-6 text-base',
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
}

export function Button({
  variant = 'primary',
  children,
  onClick,
  disabled = false,
  fullWidth = false,
  size = 'md',
  icon,
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        // Override default full-width from btn-primary for non-full width
        !fullWidth && variant === 'primary' && 'w-auto',
      )}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      {children}
    </button>
  )
}
