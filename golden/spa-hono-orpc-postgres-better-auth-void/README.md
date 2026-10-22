# my-app

React · Hono · oRPC · PostgreSQL · Drizzle · Better Auth · Void, on [Vite+](https://viteplus.dev).

| Layer      | Choice                                                     |
| ---------- | ---------------------------------------------------------- |
| Frontend   | React 19, TanStack Router, TanStack Query, Tailwind CSS 4  |
| Backend    | Hono on Cloudflare Workers                                 |
| API        | oRPC (end-to-end types, no codegen) plus OpenAPI at `/api` |
| Database   | PostgreSQL 18, Drizzle ORM v1                              |
| Auth       | Better Auth, email and password, sessions in PostgreSQL    |
| UI         | shadcn/ui on Base UI, in `packages/ui`                     |
| Deployment | Void 1.2.1 on Cloudflare Workers (preview)                 |
| Toolchain  | Vite+ (`vp`): dev, build, test, lint, format, type check   |

## Getting started

```sh
vp install
docker compose up -d db   # or point DATABASE_URL at any Postgres
vp run db:migrate
vp run dev
```

Open http://localhost:5173 and create an account. API docs are at http://localhost:5173/api.

The browser always talks to one origin: in development Vite proxies `/api` to the server, in production the server serves the SPA. Session cookies therefore stay first-party and no CORS is configured. `BETTER_AUTH_URL` is that browser-facing origin (`http://localhost:5173` in development), not the server's own port.

## Environment

Each app loads the `.env` in its directory. Project creation wrote them with the values below and generated a unique `BETTER_AUTH_SECRET`. Git ignores these files. For a fresh clone, recreate them from these examples and fill in the empty `BETTER_AUTH_SECRET` with the output of `openssl rand -base64 32`; the server rejects an unset secret.

`apps/server/.env`

```dotenv
DATABASE_URL=postgres://postgres:postgres@localhost:5432/my_app
BETTER_AUTH_URL=http://localhost:5173
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

This deployment option is in preview. It deploys to your own Cloudflare account; Void manages the Worker and binds your existing Hyperdrive, while Drizzle owns the schema and migrations.

Before the first deploy, create a Hyperdrive configuration in the Cloudflare dashboard for the production database and turn **Query caching off**. Supply its ID as `HYPERDRIVE_ID` in every deployment shell; `void.config.ts` binds that existing resource. Void's browser login can deploy an existing binding without a Hyperdrive-edit API token, but cannot create one. Automatic provisioning is not used because it enables query caching, which can return stale todos or revoked sessions after a write. Connection pooling still works with caching disabled.

```sh
vp exec --filter @my-app/server void connect --platform cloudflare
vp exec --filter @my-app/server void secret put BETTER_AUTH_SECRET
vp exec --filter @my-app/server void secret put BETTER_AUTH_URL
HYPERDRIVE_ID='<cache-disabled-config-id>' DATABASE_URL='postgresql://user:password@host:5432/my-app' vp run deploy
```

In PowerShell, set the deployment values before running the same command:

```powershell
$env:HYPERDRIVE_ID = '<cache-disabled-config-id>'
$env:DATABASE_URL = 'postgresql://user:password@host:5432/my-app'
vp run deploy
```

`BETTER_AUTH_URL` is the origin users open: your custom domain, or `https://my-app.<your-subdomain>.workers.dev`. Void checks `env.ts` before uploading, so set both secrets before the first deploy.

The deploy script requires an explicit `DATABASE_URL` and a valid `HYPERDRIVE_ID` in the shell before reading any local `.env` or applying Drizzle migrations. Both must target the same production database. It then deploys using the existing Hyperdrive; its cache-disabled setting remains your responsibility. Keep these deployment values out of Worker secrets: the Worker prefers `DATABASE_URL` over Hyperdrive, which is how `void dev` reaches a local database. Void's built-in database migrations and auth are not used.

Commit `void.lock.json`, which belongs to your deployment state and is never generated or merged by vibestart. Run `void prepare` from `apps/server` after cloning; the package prepare script also runs it on install. Local `.env` values are not uploaded. Use `void secret put` for production server values.

Workers create database clients per request and release them after the response stream ends; Hyperdrive pools production connections.
