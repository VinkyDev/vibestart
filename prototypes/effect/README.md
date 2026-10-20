# my-app

React · Effect · PostgreSQL · Drizzle · Better Auth · Node · Docker, on [Vite+](https://viteplus.dev).

> **Prototype.** This is the hand-written target for a vibestart Effect stack, not generator output. CI does not build or test it yet. See [Status](#status).

| Layer     | Choice                                                                                   |
| --------- | ---------------------------------------------------------------------------------------- |
| Frontend  | React 19, TanStack Router, Effect Atom (`AtomRpc`, `AtomHttpApi`), Tailwind CSS 4        |
| Backend   | Effect `HttpRouter` on `@effect/platform-node`, Node.js 24                               |
| API       | Effect RPC at `/rpc` for the app; Effect HttpApi at `/api` with OpenAPI and Scalar docs  |
| Contracts | `packages/contracts`: Effect Schema, shared by server and browser, depending on `effect` |
| Config    | Effect `Config` (secrets as `Redacted`)                                                  |
| Database  | PostgreSQL 18, Drizzle ORM v1 on `@effect/sql-pg`                                        |
| Auth      | Better Auth, email and password, sessions in PostgreSQL, mounted as an Effect route      |
| UI        | shadcn/ui on Base UI, in `packages/ui`                                                   |
| Tests     | `@effect/vitest` integration tests in process; TesterArmy e2e in Chromium                |
| Deploy    | Docker: one self-contained image, no `node_modules` at runtime                           |
| Toolchain | Vite+ (`vp`): dev, build, test, lint, format, type check                                 |

## Getting started

```sh
vp install
docker compose up -d db   # or point DATABASE_URL at any Postgres
vp run db:migrate
vp run dev
```

Open http://localhost:5173 and create an account. API docs are at http://localhost:5173/api/docs.

The browser always talks to one origin: in development Vite proxies `/rpc` and `/api` to the server, in production the server serves the SPA. Session cookies therefore stay first-party and no CORS is configured. `BETTER_AUTH_URL` is that browser-facing origin (`http://localhost:5173` in development), not the server's own port.

## Environment

Each app loads the `.env` in its directory. Project creation wrote them with the values below and generated a unique `BETTER_AUTH_SECRET`. Git ignores these files. For a fresh clone, recreate them from these examples and fill in the empty `BETTER_AUTH_SECRET` with the output of `openssl rand -base64 32`; the server rejects an unset secret.

`apps/server/.env`

```dotenv
DATABASE_URL=postgres://postgres:postgres@localhost:5432/my_app
BETTER_AUTH_URL=http://localhost:5173
BETTER_AUTH_SECRET=
PORT=3000
```

## Commands

```sh
vp check          # format, lint, type check
vp run knip       # unused files, exports, dependencies, and catalog entries
vp test           # unit and integration tests (Vitest)
vp run test:e2e   # end-to-end tests (TesterArmy e2e) in Chromium, against a real server and database
vp run ready      # check + knip + test + test:e2e + production build
```

The first `vp run test:e2e` needs a browser: `cd apps/web && vp exec e2e-web install chromium`.

TesterArmy e2e sends anonymous usage telemetry; set `E2E_TELEMETRY_DISABLED=1` to turn it off.

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

This starts PostgreSQL, runs migrations once, then serves the API and the web app on http://localhost:3000.

The image runs two entry points from the same build:

- `node dist/migrate.mjs` applies pending migrations and exits;
- `node dist/index.mjs` serves `/rpc`, `/api`, `/api/auth`, and the SPA.

Both read `DATABASE_URL`, `BETTER_AUTH_URL` (the public origin), and `BETTER_AUTH_SECRET`; the server also reads `PORT` (default `3000`).

## Status

Written against effect 4.0.5. `vp install` and `vp check` pass. Not yet run: the integration and e2e tests (they need PostgreSQL) and the Docker build. Known gaps, each with the condition that removes it:

- **Drizzle.** `drizzle-orm` 1.0.0-rc.4's `effect-postgres` driver fails to load on effect 4.0.5, so the catalog pins the `rc5` snapshot `1.0.0-rc.5-5935859`. Its type declarations still import `effect/unstable/sql/SqlError`, which effect 4 no longer exports. Removed when a Drizzle release targets effect 4 stable.
- **Two pools.** Better Auth's Drizzle adapter takes only the Promise driver (better-auth#7234), so `packages/auth` holds a small `postgres` pool beside the `@effect/sql-pg` one. Removed when the adapter accepts an Effect database.
- **Security headers.** Effect's HTTP server has no counterpart to Hono's `secureHeaders`; none are set yet.
- **Client validation.** The RPC client validates the encoded payload, so a form decodes its input with the contract schema (`TodoTitle`) before calling; the server still rejects invalid payloads, which `createRaw` tests.
