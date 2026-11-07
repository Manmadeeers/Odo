import type { ButtonHTMLAttributes } from 'react'

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isSubmitting?: boolean
  submittingLabel?: string
}

export function SubmitButton({
  isSubmitting = false,
  submittingLabel = 'Please wait…',
  children,
  ...buttonProps
}: SubmitButtonProps) {
  return (
    <button
      {...buttonProps}
      className="button button-primary"
      type="submit"
      disabled={isSubmitting || buttonProps.disabled}
    >
      {isSubmitting ? submittingLabel : children}
    </button>
  )
}
