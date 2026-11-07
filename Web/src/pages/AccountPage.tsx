import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/useAuth'
import { FormStatus } from '../components/ui/FormStatus'
import { PasswordField } from '../components/ui/PasswordField'
import { SubmitButton } from '../components/ui/SubmitButton'
import { getErrorMessage, getFormString } from '../lib/forms'

export function AccountPage() {
  const { user, changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(null)
    setError(null)
    const form = event.currentTarget
    const formData = new FormData(form)
    const currentPassword = getFormString(formData, 'currentPassword')
    const newPassword = getFormString(formData, 'newPassword')

    if (currentPassword === newPassword) {
      setError('Your new password must be different from your current password')
      return
    }

    if (newPassword !== getFormString(formData, 'confirmPassword')) {
      setError('New passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      await changePassword(currentPassword, newPassword)
      setStatus('Password changed successfully')
      form.reset()
    } catch (submissionError: unknown) {
      setError(getErrorMessage(submissionError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <main className="account-page">
      <header className="app-header">
        <Link className="brand" to="/" aria-label="Odo home">
          <span className="brand-mark" aria-hidden="true">
            O
          </span>
          <span>Odo</span>
        </Link>
        <button
          className="button button-secondary"
          type="button"
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
        >
          {isLoggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </header>

      <div className="account-content">
        <section className="account-intro">
          <p className="eyebrow">Account</p>
          <h1>Your Odo profile</h1>
          <p>Signed in as {user?.email}</p>
        </section>

        <section className="settings-card" aria-labelledby="password-heading">
          <div>
            <p className="eyebrow">Security</p>
            <h2 id="password-heading">Change password</h2>
            <p>Updating it signs out your other Odo sessions.</p>
          </div>

          {status && <FormStatus tone="success">{status}</FormStatus>}
          {error && <FormStatus tone="error">{error}</FormStatus>}

          <form className="auth-form" onSubmit={handlePasswordChange}>
            <PasswordField
              label="Current password"
              name="currentPassword"
              autoComplete="current-password"
              minLength={12}
              maxLength={128}
              required
            />
            <PasswordField
              label="New password"
              name="newPassword"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              hint="Use at least 12 characters."
              required
            />
            <PasswordField
              label="Confirm new password"
              name="confirmPassword"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
            <SubmitButton
              isSubmitting={isSubmitting}
              submittingLabel="Changing password…"
            >
              Change password
            </SubmitButton>
          </form>
        </section>
      </div>
    </main>
  )
}
