import { Link } from 'react-router'
import { AuthLayout } from '../components/auth/AuthLayout'

export function NotFoundPage() {
  return (
    <AuthLayout
      eyebrow="404"
      title="This road goes nowhere"
      description="The page you were looking for has moved or never existed."
      footer={
        <Link className="button button-primary" to="/">
          Return to Odo
        </Link>
      }
    >
      <div className="empty-state-mark" aria-hidden="true">
        ?
      </div>
    </AuthLayout>
  )
}
