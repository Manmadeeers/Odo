import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { authApi } from '../api/auth-api'
import { AuthLayout } from '../components/auth/AuthLayout'
import { FormField } from '../components/ui/FormField'
import { FormStatus } from '../components/ui/FormStatus'
import { SubmitButton } from '../components/ui/SubmitButton'
import { getErrorMessage, getFormString } from '../lib/forms'

export function ForgotPasswordPage() {
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setStatus(null)
    setIsSubmitting(true)

    try {
      const response = await authApi.forgotPassword(
        getFormString(new FormData(event.currentTarget), 'email').trim(),
      )
      setStatus(response.message)
    } catch (submissionError: unknown) {
      setError(getErrorMessage(submissionError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your account email and we will send you a secure reset link."
      footer={<Link to="/login">Back to sign in</Link>}
    >
      {status && <FormStatus tone="success">{status}</FormStatus>}
      {error && <FormStatus tone="error">{error}</FormStatus>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <FormField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <SubmitButton
          isSubmitting={isSubmitting}
          submittingLabel="Sending reset link…"
        >
          Send reset link
        </SubmitButton>
      </form>
    </AuthLayout>
  )
}
