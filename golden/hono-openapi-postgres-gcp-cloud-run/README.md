# my-app

Hono · OpenAPI · PostgreSQL · Drizzle · Node · Google Cloud Run, on [Vite+](https://viteplus.dev).

| Layer      | Choice                                                                                |
| ---------- | ------------------------------------------------------------------------------------- |
| Backend    | Hono on Node.js 26                                                                    |
| API        | REST routes with `@hono/zod-openapi`, a typed `hono/client`, reference docs at `/api` |
| Database   | PostgreSQL 18, Drizzle ORM v1                                                         |
| Deployment | Google Cloud Run with Alchemy (preview)                                               |
| Toolchain  | Vite+ (`vp`): dev, build, test, lint, format, type check                              |

## Getting started

```sh
vp install
docker compose up -d db   # or point DATABASE_URL at any Postgres
vp run db:migrate
vp run dev
```

The API listens on http://localhost:3000. API docs are at http://localhost:3000/api.

## Environment

Each app loads the `.env` in its directory. Project creation wrote them with these values; git ignores them, so a fresh clone recreates them from here.

`apps/server/.env`

```dotenv
DATABASE_URL=postgres://postgres:postgres@localhost:5432/my_app
PORT=3000
```

## Commands

```sh
vp check       # format, lint, type check
vp run knip    # unused files, exports, dependencies, and catalog entries
vp test        # unit and integration tests (Vitest)
vp run ready   # check + knip + test + production build
```

## Database

Edit a table in `packages/db/src/schema/`, then:

```sh
vp run db:generate   # writes a migration to packages/db/src/migrations/
vp run db:migrate    # applies it
```

## Production

Follow [the Google Cloud Run deployment guide](DEPLOYMENT.md) to publish an image, plan changes and deploy.
