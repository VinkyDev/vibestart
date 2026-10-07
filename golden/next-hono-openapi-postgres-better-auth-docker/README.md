# my-app

Next.js · Hono · OpenAPI · PostgreSQL · Drizzle · Better Auth · Node · Docker, on [Vite+](https://viteplus.dev).

| Layer     | Choice                                                                                |
| --------- | ------------------------------------------------------------------------------------- |
| Framework | Next.js 16 App Router, React 19 with React Compiler, typed routes                     |
| Data      | TanStack Query, prefetched in Server Components and hydrated, Tailwind 4              |
| Backend   | Hono on Node.js 24                                                                    |
| API       | REST routes with `@hono/zod-openapi`, a typed `hono/client`, reference docs at `/api` |
| Database  | PostgreSQL 18, Drizzle ORM v1                                                         |
| Auth      | Better Auth, email and password, sessions in PostgreSQL                               |
| UI        | shadcn/ui on Base UI, in `packages/ui`                                                |
| Deploy    | Docker: the Next.js standalone server and the Hono server from one image              |
| Toolchain | Vite+ (`vp`): lint, format, type check, test; Next.js builds the app                  |

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

This starts PostgreSQL, runs migrations once, then serves the app on http://localhost:3000.

The image runs three entry points from the same build:

- `node dist/migrate.mjs` applies pending migrations and exits;
- `node dist/index.mjs` (the `server` service) serves `/api` and `/api/auth`;
- `node apps/web/server.js` is the Next.js standalone server for the pages, and forwards `/api` to it at `SERVER_URL`.

The migration and the API server read `DATABASE_URL`, `BETTER_AUTH_URL` (the public origin), and `BETTER_AUTH_SECRET`, and the app reads `SERVER_URL`. Each server also reads `PORT` (default `3000`).
