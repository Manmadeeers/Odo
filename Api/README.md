# Odo API

NestJS REST API for Odo, using Fastify, TypeORM, PostgreSQL, PostGIS, and a
self-hosted Valhalla bicycle-routing service.

## Run locally

Start PostgreSQL, Mailpit, and Valhalla from the repository root:

```bash
docker compose up -d
```

On its first start, Valhalla downloads the Belarus OpenStreetMap extract and
builds routing tiles in the persistent `valhalla_data` Docker volume. This can
take several minutes. Follow the build and check readiness with:

```bash
docker compose logs -f valhalla
curl http://127.0.0.1:8002/status
```

Do not send route requests until the status endpoint responds successfully.
Subsequent starts reuse the generated tiles.

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
POST /auth/change-password
POST /auth/confirm-email
POST /auth/resend-verification-email
POST /auth/forgot-password
POST /auth/reset-password
GET /users/me
POST /routes/preview
```

Registering creates an unverified account but does not issue access or refresh
tokens. It sends an email containing a verification link. Submit the link's
`token` query parameter to the confirmation endpoint, then log in:

```json
{ "token": "<email verification token>" }
```

Login requires a verified email address. Correct credentials for an
unverified account receive `403 Forbidden` until confirmation is completed.

Refresh tokens are single-use and rotated by `POST /auth/refresh-token`.
Authenticated requests use `Authorization: Bearer <access token>`. Logging out
revokes the current session, so neither its access token nor refresh token can
be used again.

`POST /auth/change-password` requires an access token plus `currentPassword`
and `newPassword`. A successful change keeps the current session active and
revokes the user's other sessions.

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

## Bicycle routing

The API exposes Valhalla through `POST /routes/preview`. Clients do not call
Valhalla directly. This keeps the upstream service private and gives the mobile
app a stable Odo response format.

The endpoint requires an access token and is limited to 20 requests per minute
per client. It accepts between 2 and 25 ordered locations. Latitude must be
between `-90` and `90`; longitude must be between `-180` and `180`.

```bash
curl http://localhost:3000/routes/preview \
  -H 'Authorization: Bearer <access token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "locations": [
      { "lat": 53.9006, "lon": 27.5590 },
      { "lat": 53.9111, "lon": 27.5733 }
    ]
  }'
```

Odo always requests Valhalla's `bicycle` costing model. Successful responses
use meters and seconds and contain one leg for each pair of route break points:

```json
{
  "distanceMeters": 5420,
  "durationSeconds": 1180,
  "polylinePrecision": 6,
  "legs": [
    {
      "distanceMeters": 5420,
      "durationSeconds": 1180,
      "encodedPolyline": "<Valhalla polyline6>",
      "maneuvers": [
        {
          "instruction": "Turn right onto the cycleway.",
          "distanceMeters": 120,
          "durationSeconds": 30,
          "beginShapeIndex": 0,
          "endShapeIndex": 8,
          "type": 10
        }
      ]
    }
  ]
}
```

Route shapes use six decimal places of polyline precision. Decode them as
polyline6; a standard precision-5 decoder produces incorrect coordinates.

Routing-related responses include:

- `400 Bad Request` when the locations are invalid or Valhalla cannot calculate
  a route for them.
- `401 Unauthorized` when the access token is missing, invalid, or belongs to
  an inactive session.
- `429 Too Many Requests` when the route-specific rate limit is exceeded.
- `502 Bad Gateway` when Valhalla is unavailable or returns an invalid response.
- `504 Gateway Timeout` when Valhalla exceeds the configured timeout.

### Routing configuration

The API reads these values from `Api/.env`:

```text
VALHALLA_URL=http://127.0.0.1:8002
VALHALLA_TIMEOUT_MS=10000
```

`VALHALLA_URL` should remain private to the API. The default is correct when
Nest runs on the host. If the API is moved into the Compose network, use
`http://valhalla:8002` instead.

The Compose service can be customized with:

```text
VALHALLA_PORT=8002
VALHALLA_TILE_URL=https://download.geofabrik.de/europe/belarus-latest.osm.pbf
VALHALLA_BUILD_ELEVATION=False
VALHALLA_SERVER_THREADS=2
```

Changing the tile source or enabling elevation may cause Valhalla to download
additional data and rebuild its routing graph.

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
