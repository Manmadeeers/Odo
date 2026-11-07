import type { ReactNode } from 'react'
import { Link } from 'react-router'

interface AuthLayoutProps {
  eyebrow?: string
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <main className="auth-layout">
      <section className="auth-story" aria-label="About Odo">
        <Link className="brand" to="/" aria-label="Odo home">
          <span className="brand-mark" aria-hidden="true">
            O
          </span>
          <span>Odo</span>
        </Link>
        <div className="story-copy">
          <p className="story-kicker">Ride. Remember. Repeat.</p>
          <h2>Every kilometre tells part of your story.</h2>
          <p>
            Keep your cycling life together—from everyday commutes to the
            roads you will remember for years.
          </p>
        </div>
        <div className="road-line" aria-hidden="true" />
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          <p className="auth-description">{description}</p>
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
      </section>
    </main>
  )
}
