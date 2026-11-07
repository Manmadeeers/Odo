import type { InputHTMLAttributes } from 'react'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export function FormField({
  label,
  hint,
  id,
  name,
  className,
  ...inputProps
}: FormFieldProps) {
  const inputId = id ?? name
  const hintId = hint && inputId ? `${inputId}-hint` : undefined

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input
        {...inputProps}
        className={className}
        id={inputId}
        name={name}
        aria-describedby={hintId}
      />
      {hint && (
        <span className="field-hint" id={hintId}>
          {hint}
        </span>
      )}
    </div>
  )
}
