import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { authApi } from '../api/auth-api'
import { AuthLayout } from '../components/auth/AuthLayout'
import { FormField } from '../components/ui/FormField'
import { FormStatus } from '../components/ui/FormStatus'
import { PasswordField } from '../components/ui/PasswordField'
import { SubmitButton } from '../components/ui/SubmitButton'
import { getErrorMessage, getFormString } from '../lib/forms'

export function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const email = getFormString(formData, 'email').trim()
    const password = getFormString(formData, 'password')

    if (password !== getFormString(formData, 'confirmPassword')) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await authApi.register(email, password)
      navigate('/check-email', {
        replace: true,
        state: { email, message: response.message },
      })
    } catch (submissionError: unknown) {
      setError(getErrorMessage(submissionError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Join the ride"
      title="Create your account"
      description="Start building a record of every road, route, and milestone."
      footer={
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      {error && <FormStatus tone="error">{error}</FormStatus>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <FormField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          hint="Use at least 12 characters."
          required
        />
        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
        <SubmitButton
          isSubmitting={isSubmitting}
          submittingLabel="Creating account…"
        >
          Create account
        </SubmitButton>
      </form>
    </AuthLayout>
  )
}
