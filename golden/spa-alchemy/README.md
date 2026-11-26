# my-app

React · Alchemy, on [Vite+](https://viteplus.dev).

| Layer      | Choice                                                    |
| ---------- | --------------------------------------------------------- |
| Frontend   | React 19, TanStack Router, TanStack Query, Tailwind CSS 4 |
| UI         | shadcn/ui on Base UI, in `packages/ui`                    |
| Deployment | Alchemy 2.0.0-beta.87 on Cloudflare Workers (preview)     |
| Toolchain  | Vite+ (`vp`): dev, build, test, lint, format, type check  |

## Getting started

```sh
vp install
vp run dev
```

Open http://localhost:5173.

## Commands

```sh
vp run typegen    # route types; dev generates these automatically
vp check          # format, lint, type check
vp run knip       # unused files, exports, dependencies, and catalog entries
vp test           # unit tests (Vitest)
vp run test:e2e   # end-to-end tests (Playwright) in Chromium, against the dev server
vp run ready      # typegen + check + knip + test + test:e2e + production build
```

The first `vp run test:e2e` needs a browser: `cd apps/web && vp exec playwright install chromium`.

## Deploy to Cloudflare with Alchemy

The root `alchemy.run.ts` deploys to your Cloudflare account. Connect your account with `vp exec alchemy profile edit --add Cloudflare`. For unattended deployments, set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. On first deploy, Alchemy bootstraps an account-wide state Worker, SQLite-backed Durable Object and Secrets Store credentials. See [Cloudflare setup](https://alchemy.run/cloudflare/setup/) and [state store permissions](https://alchemy.run/state-store/).

Run `vp run deploy` from the project root to apply the production deployment without an interactive prompt. Subsequent deployments reuse the same stack and `prod` stage. The command prints the site URL. Local development and `vp run ready` require no Cloudflare account.
