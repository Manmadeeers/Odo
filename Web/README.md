# Odo Web

React and TypeScript web client for Odo, built with Vite.

## Run locally

Start the API on `http://localhost:3000`, then run:

```bash
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` and proxies `/api` requests to
the local API. Copy `.env.example` to `.env` only when you need to override the
API base URL.

## Authentication routes

- `/login`
- `/register`
- `/check-email`
- `/confirm-email?token=...`
- `/forgot-password`
- `/reset-password?token=...`
- `/account` (authenticated)

## Checks

```bash
npm run lint
npm run build
```
