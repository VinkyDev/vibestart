# my-app

React · Void, on [Vite+](https://viteplus.dev).

| Layer      | Choice                                                    |
| ---------- | --------------------------------------------------------- |
| Frontend   | React 19, TanStack Router, TanStack Query, Tailwind CSS 4 |
| UI         | shadcn/ui on Base UI, in `packages/ui`                    |
| Deployment | Void 1.2.1 on Cloudflare Workers (preview)                |
| Toolchain  | Vite+ (`vp`): dev, build, test, lint, format, type check  |

## Getting started

```sh
vp install
vp run dev
```

Open http://localhost:5173.

## Commands

```sh
vp check          # format, lint, type check
vp run knip       # unused files, exports, dependencies, and catalog entries
vp test           # unit tests (Vitest)
vp run test:e2e   # end-to-end tests (Playwright) in Chromium, against the dev server
vp run ready      # check + knip + test + test:e2e + production build
```

The first `vp run test:e2e` needs a browser: `cd apps/web && vp exec playwright install chromium`.

## Deploy to Cloudflare with Void

This deployment option is in preview. It deploys to your own Cloudflare account; Void builds the SPA and uploads it as static assets.

```sh
vp exec --filter @my-app/web void connect --platform cloudflare
vp run deploy
```

Commit `void.lock.json`, which belongs to your deployment state and is never generated or merged by vibestart.
