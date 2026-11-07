import { useState, type InputHTMLAttributes } from 'react'

interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  hint?: string
}

export function PasswordField({
  label,
  hint,
  id,
  name,
  ...inputProps
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)
  const inputId = id ?? name
  const hintId = hint && inputId ? `${inputId}-hint` : undefined

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <div className="password-input">
        <input
          {...inputProps}
          id={inputId}
          name={name}
          type={isVisible ? 'text' : 'password'}
          aria-describedby={hintId}
        />
        <button
          type="button"
          className="visibility-toggle"
          disabled={inputProps.disabled}
          aria-label={`${isVisible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          onClick={() => setIsVisible((visible) => !visible)}
        >
          {isVisible ? 'Hide' : 'Show'}
        </button>
      </div>
      {hint && (
        <span className="field-hint" id={hintId}>
          {hint}
        </span>
      )}
    </div>
  )
}
