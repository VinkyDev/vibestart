# my-app

TanStack Start · oRPC · PostgreSQL · Drizzle · Better Auth · Void, on [Vite+](https://viteplus.dev).

| Layer      | Choice                                                     |
| ---------- | ---------------------------------------------------------- |
| Framework  | TanStack Start (SSR, file routes, server routes), React 19 |
| Data       | TanStack Query with SSR dehydration, Tailwind CSS 4        |
| API        | oRPC (end-to-end types, no codegen) plus OpenAPI at `/api` |
| Database   | PostgreSQL 18, Drizzle ORM v1                              |
| Auth       | Better Auth, email and password, sessions in PostgreSQL    |
| UI         | shadcn/ui on Base UI, in `packages/ui`                     |
| Deployment | Void 1.1.11 on Cloudflare Workers (preview)                |
| Toolchain  | Vite+ (`vp`): dev, build, test, lint, format, type check   |

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
vp check          # format, lint, type check
vp run knip       # unused files, exports, dependencies, and catalog entries
vp test           # unit and integration tests (Vitest)
vp run test:e2e   # end-to-end tests (Playwright) in Chromium, against a real server and database
vp run ready      # check + knip + test + test:e2e + production build
```

The first `vp run test:e2e` needs a browser: `cd apps/web && vp exec playwright install chromium`.

## Database

Edit a table in `packages/db/src/schema/`, then:

```sh
vp run db:generate   # writes a migration to packages/db/src/migrations/
vp run db:migrate    # applies it
```

## Deploy to Cloudflare with Void

This deployment option is in preview. It deploys to your own Cloudflare account; Void manages the Worker and Hyperdrive, while Drizzle owns the schema and migrations.

```sh
vp exec --filter @my-app/web void connect --platform cloudflare
vp exec --filter @my-app/web void secret put BETTER_AUTH_SECRET
vp exec --filter @my-app/web void secret put BETTER_AUTH_URL
DATABASE_URL='postgres-or-mysql-production-url' vp run deploy
```

The deploy script requires DATABASE_URL in the shell before reading any local .env. It applies Drizzle migrations first, then deploys and creates Hyperdrive. Use the production dialect's full connection URL. Void's built-in database migrations and auth are not used.

Commit `void.lock.json`, which belongs to your deployment state and is never generated or merged by vibestart. Run `void prepare` from `apps/web` after cloning; the package prepare script also runs it on install. Local `.env` values are not uploaded. Use `void secret put` for production server values.

Workers create database clients per request and release them after the response stream ends; Hyperdrive pools production connections.
