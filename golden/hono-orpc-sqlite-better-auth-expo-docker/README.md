# my-app

Hono · oRPC · SQLite · Drizzle · Better Auth · Expo · Node · Docker, on [Vite+](https://viteplus.dev).

| Layer     | Choice                                                                             |
| --------- | ---------------------------------------------------------------------------------- |
| Backend   | Hono on Node.js 24                                                                 |
| API       | oRPC (end-to-end types, no codegen) plus OpenAPI at `/api`                         |
| Database  | SQLite through Node's built-in `node:sqlite`, Drizzle ORM v1                       |
| Auth      | Better Auth, email and password, sessions in SQLite                                |
| Mobile    | Expo SDK 58 with Expo Router and Uniwind (Tailwind CSS 4)                          |
| Deploy    | Docker: one self-contained image, no `node_modules` at runtime, SQLite on a volume |
| Toolchain | Vite+ (`vp`): dev, build, test, lint, format, type check                           |

## Getting started

```sh
vp install
vp run db:migrate   # creates apps/server/local.db
vp run dev
vp run dev:mobile   # in a second terminal
```

The API listens on http://localhost:3000. API docs are at http://localhost:3000/api.

`vp run dev:mobile` prints a QR code: scan it with Expo Go on a phone on the same network as this machine, or press `i` or `a` for a simulator. The app reaches the server on port 3000 of this machine, so let the firewall pass it; a release build takes the server's origin from `EXPO_PUBLIC_API_URL` in `apps/mobile/.env`.

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

```sh
BETTER_AUTH_SECRET=$(openssl rand -base64 32) docker compose up --build
```

This runs migrations once, then serves the API on http://localhost:3000. The database lives at `/data/app.db` on the `data` volume.

The image runs two entry points from the same build:

- `node dist/migrate.mjs` applies pending migrations and exits;
- `node dist/index.mjs` serves `/rpc`, `/api`, and `/api/auth`.

Both read `DATABASE_URL`, `BETTER_AUTH_URL` (the public origin), and `BETTER_AUTH_SECRET`; the server also reads `PORT` (default `3000`).

SQLite allows one writer at a time, so run a single app replica. Back up the volume, or move to the PostgreSQL template when you need several.
