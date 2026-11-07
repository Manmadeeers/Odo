import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { authApi } from '../api/auth-api'
import { AuthLayout } from '../components/auth/AuthLayout'
import { FormStatus } from '../components/ui/FormStatus'
import { getErrorMessage } from '../lib/forms'

type ConfirmationState = 'confirming' | 'confirmed' | 'failed'

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const requestedRef = useRef(false)
  const [state, setState] = useState<ConfirmationState>(
    token ? 'confirming' : 'failed',
  )
  const [message, setMessage] = useState(
    token
      ? 'Confirming your email address…'
      : 'This verification link is missing its token.',
  )

  useEffect(() => {
    if (requestedRef.current) return
    requestedRef.current = true

    if (!token) return

    void authApi
      .confirmEmail(token)
      .then((response) => {
        setState('confirmed')
        setMessage(response.message)
      })
      .catch((error: unknown) => {
        setState('failed')
        setMessage(getErrorMessage(error))
      })
  }, [token])

  return (
    <AuthLayout
      eyebrow="Email verification"
      title={
        state === 'confirmed'
          ? 'You are verified'
          : state === 'failed'
            ? 'This link did not work'
            : 'Confirming your email'
      }
      description="A verified email keeps your account secure and recoverable."
      footer={
        state === 'confirmed' ? (
          <Link className="button button-primary" to="/login">
            Continue to sign in
          </Link>
        ) : (
          <Link to="/check-email">Request another verification email</Link>
        )
      }
    >
      <FormStatus
        tone={
          state === 'confirmed'
            ? 'success'
            : state === 'failed'
              ? 'error'
              : 'info'
        }
      >
        {message}
      </FormStatus>
    </AuthLayout>
  )
}
