import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ApiError } from '../api/http'
import { useAuth } from '../auth/useAuth'
import { AuthLayout } from '../components/auth/AuthLayout'
import { FormField } from '../components/ui/FormField'
import { FormStatus } from '../components/ui/FormStatus'
import { PasswordField } from '../components/ui/PasswordField'
import { SubmitButton } from '../components/ui/SubmitButton'
import { getErrorMessage, getFormString } from '../lib/forms'

interface LoginLocationState {
  from?: string
  message?: string
  email?: string
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LoginLocationState | null
  const [error, setError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setUnverifiedEmail(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const email = getFormString(formData, 'email').trim()

    try {
      await login(email, getFormString(formData, 'password'))
      navigate(state?.from ?? '/account', { replace: true })
    } catch (submissionError: unknown) {
      if (submissionError instanceof ApiError && submissionError.status === 403) {
        setUnverifiedEmail(email)
      }
      setError(getErrorMessage(submissionError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to Odo"
      description="Pick up where your last ride ended."
      footer={
        <p>
          New to Odo? <Link to="/register">Create an account</Link>
        </p>
      }
    >
      {state?.message && <FormStatus tone="success">{state.message}</FormStatus>}
      {error && <FormStatus tone="error">{error}</FormStatus>}
      {unverifiedEmail && (
        <Link to="/check-email" state={{ email: unverifiedEmail }}>
          Resend the verification email
        </Link>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        <FormField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state?.email}
          required
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          required
        />
        <div className="form-link-row">
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <SubmitButton
          isSubmitting={isSubmitting}
          submittingLabel="Signing in…"
        >
          Sign in
        </SubmitButton>
      </form>
    </AuthLayout>
  )
}
