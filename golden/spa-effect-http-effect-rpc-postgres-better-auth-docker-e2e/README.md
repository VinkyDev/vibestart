# my-app

Effect · PostgreSQL · Node · Docker, on [Vite+](https://viteplus.dev).

| Layer     | Choice                                                              |
| --------- | ------------------------------------------------------------------- |
| Frontend  | React 19, TanStack Router, Effect Atom, Tailwind CSS 4              |
| Backend   | Effect HTTP on Node.js 26                                           |
| API       | Effect RPC, HttpApi and Schema; Effect Atom in the browser          |
| Database  | PostgreSQL 18, Drizzle ORM v1                                       |
| Auth      | Better Auth with an Effect service boundary and PostgreSQL sessions |
| UI        | shadcn/ui on Base UI, in `packages/ui`                              |
| Deploy    | Docker: one self-contained image, no `node_modules` at runtime      |
| Toolchain | Vite+ (`vp`): dev, build, test, lint, format, type check            |

## Getting started

```sh
vp install
docker compose up -d db   # or point DATABASE_URL at any Postgres
vp run db:migrate
vp run dev
```

Open http://localhost:5173 and create an account. API docs are at http://localhost:5173/api/docs. Vite proxies the API in development; the Effect server serves the SPA in production.

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
vp run test:e2e   # end-to-end tests (TesterArmy e2e) against the real Effect server and PostgreSQL
vp run ready      # check + knip + test + test:e2e + production build
```

TesterArmy e2e sends anonymous usage telemetry; set `E2E_TELEMETRY_DISABLED=1` to turn it off.

The first `vp run test:e2e` needs Chromium: `cd apps/web && vp exec e2e-web install chromium`.

## Production

```sh
BETTER_AUTH_SECRET=$(openssl rand -base64 32) docker compose up --build
```

This starts PostgreSQL, runs migrations once, then serves the API and the web app on http://localhost:3000.

The image runs two entry points from the same build:

- `node dist/migrate.mjs` applies pending migrations and exits;
- `node dist/index.mjs` serves `/rpc`, `/api`, `/api/auth`, and the SPA.

The migration reads `DATABASE_URL`; the server reads `DATABASE_URL`, `BETTER_AUTH_URL` (the public origin), `BETTER_AUTH_SECRET`, and `PORT` (default `3000`). Set the public origin to the URL visitors use, including its scheme and port.
