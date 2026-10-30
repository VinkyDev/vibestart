# my-app

React · Effect · PostgreSQL · Drizzle · Better Auth · Node · Docker, on [Vite+](https://viteplus.dev).

> **Prototype.** This is the hand-written target for a vibestart Effect stack, not generator output. The dedicated Effect CI job checks it independently of generated stacks. See [Status](#status).

| Layer     | Choice                                                                                   |
| --------- | ---------------------------------------------------------------------------------------- |
| Frontend  | React 19, TanStack Router, Effect Atom (`AtomRpc`, `AtomHttpApi`), Tailwind CSS 4        |
| Backend   | Effect `HttpRouter` on `@effect/platform-node`, Node.js 26                               |
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

Each app loads the `.env` in its directory. Git ignores these files. For a fresh clone, create the server file below and fill in `BETTER_AUTH_SECRET` with the output of `openssl rand -base64 32`; the server rejects a missing or short secret.

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

Effect packages are pinned together at 4.1.0. Shared dependencies follow the golden catalog: Node 26.13.0, pnpm 12.15.0, Vite+ 1.4.0, Drizzle 1.0.0-rc.5, and Better Auth 1.7.14. Drizzle uses its published release candidate, without the earlier snapshot or a patch.

The Effect CI job runs `vp run ready` on Linux (PostgreSQL 18) and Windows (the runner’s PostgreSQL 17), including real HTTP integration tests, Chromium journeys, and production builds. Linux also builds and starts the Docker image, including repeatable migrations, sign-up, and an authenticated RPC write. It is part of the required `ci` check. This remains a prototype: promotion requires the generator to produce this project and its verified stacks to cover it; the CLI and Studio do not offer Effect yet.

## Boundaries

- **Services.** `Todos` owns SQL and ownership rules. RPC handlers read `CurrentUser` and map storage errors to public errors. Causes remain in server logs; RPC defects are sanitized before serialization.
- **Contracts.** IDs fit positive PostgreSQL integers. Titles are trimmed at the API boundary and limited to 200 Unicode code points, excluding NUL. The database separately enforces the length bound; its `btrim` is not JavaScript's Unicode normalization.
- **Client state.** Authenticated routes own a Registry keyed by session ID. It is disposed on sign-out or session replacement. Public queries keep their own Registry. Each todo owns its mutation, with writes to that row disabled while pending.
- **Resources.** A single Effect scope owns the e2e database and child processes, including failed startup. Child process shutdown has a bounded grace period.
- **Auth.** Better Auth's Drizzle adapter still requires the Promise driver, so auth owns a small `postgres` pool beside `@effect/sql-pg`. This is the only second database driver; remove it when the adapter supports Effect directly.
- **HTTP.** Global middleware adds `nosniff`, frame denial, and a referrer policy to API and static responses. TLS termination and deployment-specific CSP remain deployment concerns; the API documentation loads its own assets.
