# Odo API

NestJS REST API for Odo, using Fastify, TypeORM, PostgreSQL, and PostGIS.

## Run locally

Start PostgreSQL and Mailpit from the repository root:

```bash
docker compose up -d
```

Then start the API:

```bash
cd Api
cp .env.example .env
npm ci
npm run migration:run
npm run start:dev
```

The API is available at `http://localhost:3000`; health status is exposed at
`GET /health`.

Development emails are captured by Mailpit. Its inbox is available at
`http://localhost:8025`; no messages are delivered to real recipients.

Generate a real JWT secret before using the API outside local development:

```bash
openssl rand -base64 32
```

Authentication endpoints:

```text
POST /auth/register
POST /auth/login
POST /auth/refresh-token
POST /auth/logout
POST /auth/confirm-email
POST /auth/resend-verification-email
POST /auth/forgot-password
POST /auth/reset-password
GET /users/me
```

Registering sends an email containing a verification link. Submit the link's
`token` query parameter to the confirmation endpoint:

```json
{ "token": "<email verification token>" }
```

Login requires a verified email address. Correct credentials for an
unverified account receive `403 Forbidden` until confirmation is completed.

Refresh tokens are single-use and rotated by `POST /auth/refresh-token`.
Authenticated requests use `Authorization: Bearer <access token>`. Logging out
revokes the current session, so neither its access token nor refresh token can
be used again.

`POST /auth/resend-verification-email` accepts an email address and always
returns the same accepted response. For an unverified account, it invalidates
the previous verification token and sends a new one.

Expired sessions, email-verification tokens, and password-reset tokens are
removed periodically. Configure the interval with
`AUTH_CLEANUP_INTERVAL_MINUTES`.

Password recovery starts with an email address and always returns the same
accepted response, whether or not an account exists:

```json
{ "email": "rider@example.com" }
```

Submit the token from the reset email together with the new password:

```json
{
  "token": "<password reset token>",
  "newPassword": "at least 12 characters"
}
```

## Email

The API's mail service uses SMTP settings from the environment. Local defaults
point to Mailpit:

```text
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_FROM=Odo <noreply@odo.local>
```

`MAIL_USER` and `MAIL_PASSWORD` are optional locally. To use Brevo later, set
the same variables to its SMTP host, port, username, and key; application code
does not need to change.

## Migrations

After changing an entity, generate and review a migration:

```bash
npm run migration:generate -- src/database/migrations/DescribeChange
```

Useful migration commands:

```bash
npm run migration:show
npm run migration:run
npm run migration:revert
npm run migration:create -- src/database/migrations/DescribeChange
```

Never enable TypeORM schema synchronization; database changes belong in
versioned migrations.
