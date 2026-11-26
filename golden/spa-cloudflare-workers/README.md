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

## Production

Follow [the Cloudflare Workers deployment guide](DEPLOYMENT.md) to configure bindings, plan changes and deploy.
