# my-app

Next.js · oRPC · SQLite · Drizzle · Better Auth · Node · Docker, on [Vite+](https://viteplus.dev).

| Layer     | Choice                                                                   |
| --------- | ------------------------------------------------------------------------ |
| Framework | Next.js 16 App Router, React 19 with React Compiler, typed routes        |
| Data      | TanStack Query, prefetched in Server Components and hydrated, Tailwind 4 |
| API       | oRPC (end-to-end types, no codegen) plus OpenAPI at `/api`               |
| Database  | SQLite through Node's built-in `node:sqlite`, Drizzle ORM v1             |
| Auth      | Better Auth, email and password, sessions in SQLite                      |
| UI        | shadcn/ui on Base UI, in `packages/ui`                                   |
| Deploy    | Docker: Next.js standalone server, SQLite on a volume                    |
| Toolchain | Vite+ (`vp`): lint, format, type check, test; Next.js builds the app     |

## Getting started

```sh
vp install
vp run db:migrate   # creates apps/web/local.db
vp run dev
```

Open http://localhost:3000 and create an account. API docs are at http://localhost:3000/api.

## Commands

```sh
vp run typegen    # route types for typedRoutes; dev does this automatically
vp check          # format, lint, type check
vp run knip       # unused files, exports, dependencies, and catalog entries
vp test           # unit and integration tests (Vitest)
vp run test:e2e   # end-to-end tests (Playwright) in Chromium, against a real server and database
vp run ready      # typegen + check + knip + test + test:e2e + production build
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

This runs migrations once, then serves the app on http://localhost:3000. The database lives at `/data/app.db` on the `data` volume.

The image runs two entry points from the same build:

- `node dist/migrate.mjs` applies pending migrations and exits;
- `node apps/web/server.js` is the Next.js standalone server for the pages, `/rpc`, `/api`, and `/api/auth`.

Both read `DATABASE_URL`, `BETTER_AUTH_URL` (the public origin), and `BETTER_AUTH_SECRET`; the server also reads `PORT` (default `3000`).

SQLite allows one writer at a time, so run a single app replica. Back up the volume, or move to the PostgreSQL template when you need several.
