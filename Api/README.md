# Odo API

NestJS REST API for Odo, using Fastify, TypeORM, PostgreSQL, and PostGIS.

## Run locally

Start the database from the repository root:

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
