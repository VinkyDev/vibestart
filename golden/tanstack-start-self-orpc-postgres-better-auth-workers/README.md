# my-app

TanStack Start · oRPC · PostgreSQL · Drizzle · Better Auth, on [Vite+](https://viteplus.dev).

| Layer     | Choice                                                     |
| --------- | ---------------------------------------------------------- |
| Framework | TanStack Start (SSR, file routes, server routes), React 19 |
| Data      | TanStack Query with SSR dehydration, Tailwind CSS 4        |
| API       | oRPC (end-to-end types, no codegen) plus OpenAPI at `/api` |
| Database  | PostgreSQL 18, Drizzle ORM v1                              |
| Auth      | Better Auth, email and password, sessions in PostgreSQL    |
| UI        | shadcn/ui on Base UI, in `packages/ui`                     |
| Toolchain | Vite+ (`vp`): dev, build, test, lint, format, type check   |

## Getting started

```sh
vp install
docker compose up -d db   # or point DATABASE_URL at any Postgres
vp run db:migrate
vp run dev
```

Open http://localhost:3000 and create an account. API docs are at http://localhost:3000/api.

## Environment

Each app loads the `.env` in its directory. Project creation wrote them with the values below and generated a unique `BETTER_AUTH_SECRET`. Git ignores these files. For a fresh clone, recreate them from these examples and fill in the empty `BETTER_AUTH_SECRET` with the output of `openssl rand -base64 32`; the server rejects an unset secret.

`apps/web/.env`

```dotenv
DATABASE_URL=postgres://postgres:postgres@localhost:5432/my_app
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=
```

## Commands

```sh
vp run typegen    # route types; dev generates these automatically
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

## Workers database

Local development and migrations use `DATABASE_URL`. Before deploying, replace `your-hyperdrive-id` in `apps/web/wrangler.jsonc` with the ID of a cache-disabled [Hyperdrive configuration](https://developers.cloudflare.com/hyperdrive/) for the same database. The deployed Worker connects through the `HYPERDRIVE` binding. Run migrations against that database before switching traffic.
