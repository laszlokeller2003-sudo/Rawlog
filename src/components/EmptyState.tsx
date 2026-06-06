interface EmptyStateProps {
  message: string
  icon?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ message, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      {icon && (
        <span className="mb-4 text-[40px] leading-none select-none">{icon}</span>
      )}
      <p className="text-sm text-center" style={{ color: 'var(--text-secondary)' }}>
        {message}
      </p>
      {action && (
        <button
          type="button"
          className="btn-ghost mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
