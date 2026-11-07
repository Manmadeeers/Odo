import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { authApi } from '../api/auth-api'
import { AuthLayout } from '../components/auth/AuthLayout'
import { FormStatus } from '../components/ui/FormStatus'
import { PasswordField } from '../components/ui/PasswordField'
import { SubmitButton } from '../components/ui/SubmitButton'
import { getErrorMessage, getFormString } from '../lib/forms'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(
    token ? null : 'This password reset link is missing its token.',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return

    setError(null)
    setStatus(null)
    const form = event.currentTarget
    const formData = new FormData(form)
    const password = getFormString(formData, 'password')

    if (password !== getFormString(formData, 'confirmPassword')) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await authApi.resetPassword(token, password)
      setStatus(response.message)
      form.reset()
    } catch (submissionError: unknown) {
      setError(getErrorMessage(submissionError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Choose a new password"
      title="Secure your account"
      description="Your new password will sign out any other active sessions."
      footer={<Link to="/login">Back to sign in</Link>}
    >
      {status && <FormStatus tone="success">{status}</FormStatus>}
      {error && <FormStatus tone="error">{error}</FormStatus>}

      {!status && (
        <form className="auth-form" onSubmit={handleSubmit}>
          <PasswordField
            label="New password"
            name="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            hint="Use at least 12 characters."
            required
            disabled={!token}
          />
          <PasswordField
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
            disabled={!token}
          />
          <SubmitButton
            isSubmitting={isSubmitting}
            submittingLabel="Updating password…"
            disabled={!token}
          >
            Update password
          </SubmitButton>
        </form>
      )}
    </AuthLayout>
  )
}
