# my-app

Hono · OpenAPI · SQLite · Drizzle · Bun · Docker, on [Vite+](https://viteplus.dev).

| Layer     | Choice                                                                                |
| --------- | ------------------------------------------------------------------------------------- |
| Backend   | Hono on Bun                                                                           |
| API       | REST routes with `@hono/zod-openapi`, a typed `hono/client`, reference docs at `/api` |
| Database  | SQLite through Bun's compatible `node:sqlite`, Drizzle ORM v1                         |
| Deploy    | Docker: one self-contained image, no `node_modules` at runtime, SQLite on a volume    |
| Toolchain | Vite+ (`vp`): dev, build, test, lint, format, type check                              |

## Getting started

```sh
vp install
vp run db:migrate   # creates apps/server/local.db
vp run dev
```

The API listens on http://localhost:3000. API docs are at http://localhost:3000/api.

## Commands

```sh
vp check       # format, lint, type check
vp run knip    # unused files, exports, dependencies, and catalog entries
vp test        # unit and integration tests (Vitest)
vp run ready   # check + knip + test + production build
```

Hono requires Bun 1.4.2 or newer on PATH. Install it from https://bun.sh before running the server or its tests. Vite+ and full-stack web frameworks continue to run on Node.js.

## Database

Edit a table in `packages/db/src/schema/`, then:

```sh
vp run db:generate   # writes a migration to packages/db/src/migrations/
vp run db:migrate    # applies it
```

## Production

```sh
docker compose up --build
```

This runs migrations once, then serves the API on http://localhost:3000. The database lives at `/data/app.db` on the `data` volume.

The image runs two entry points from the same build:

- `bun dist/migrate.mjs` applies pending migrations and exits;
- `bun dist/index.mjs` serves `/api`.

Both read `DATABASE_URL`; the server also reads `PORT` (default `3000`).

SQLite allows one writer at a time, so run a single app replica. Back up the volume, or move to the PostgreSQL template when you need several.
