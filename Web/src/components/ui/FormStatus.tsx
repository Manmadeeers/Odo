interface FormStatusProps {
  tone: 'error' | 'success' | 'info'
  children: string
}

export function FormStatus({ tone, children }: FormStatusProps) {
  return (
    <div
      className={`form-status form-status-${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}
