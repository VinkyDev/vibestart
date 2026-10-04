# my-app

TanStack Start · oRPC · PostgreSQL · Drizzle · Better Auth · Node · Docker, on [Vite+](https://viteplus.dev).

| Layer     | Choice                                                            |
| --------- | ----------------------------------------------------------------- |
| Framework | TanStack Start (SSR, file routes, server routes), React 19        |
| Data      | TanStack Query with SSR dehydration, Tailwind CSS 4               |
| API       | oRPC (end-to-end types, no codegen) plus OpenAPI at `/api`        |
| Database  | PostgreSQL 18, Drizzle ORM v1                                     |
| Auth      | Better Auth, email and password, sessions in PostgreSQL           |
| UI        | shadcn/ui on Base UI, in `packages/ui`                            |
| Deploy    | Docker: one Nitro server, one image, no `node_modules` at runtime |
| Toolchain | Vite+ (`vp`): dev, build, test, lint, format, type check          |

## Getting started

```sh
vp install
docker compose up -d db   # or point DATABASE_URL at any Postgres
vp run db:migrate
vp run dev
```

Open http://localhost:3000 and create an account. API docs are at http://localhost:3000/api.

## Commands

```sh
vp check          # format, lint, type check
vp run knip       # unused files, exports, dependencies, and catalog entries
vp test           # unit and integration tests (Vitest)
vp run test:e2e   # e2e tests (Playwright) in Chromium, against a real server and database
vp run ready      # check + knip + test + test:e2e + production build
```

The first `vp run test:e2e` needs a browser: `cd apps/web && vp exec playwright install chromium`.

## Database

Edit a table in `packages/db/src/schema/`, then:

```sh
vp run db:generate   # writes a migration to packages/db/src/migrations/
vp run db:migrate    # applies it
```

## Production

```sh
BETTER_AUTH_SECRET=$(openssl rand -base64 32) docker compose up --build
```

This starts PostgreSQL, runs migrations once, then serves the app on http://localhost:3000.

The image runs two entry points from the same build:

- `node dist/migrate.mjs` applies pending migrations and exits;
- `node .output/server/index.mjs` serves the pages, `/rpc`, `/api`, and `/api/auth`.

Both read `DATABASE_URL`, `BETTER_AUTH_URL` (the public origin), and `BETTER_AUTH_SECRET`; the server also reads `PORT` (default `3000`).
