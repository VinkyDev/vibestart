# my-app

Solid 2 · Hono · Node · Docker, on [Vite+](https://viteplus.dev).

| Layer     | Choice                                                         |
| --------- | -------------------------------------------------------------- |
| Frontend  | Solid 2 with the Solid JSX compiler                            |
| Backend   | Hono on Node.js 26                                             |
| UI        | UI SDK in `packages/ui`                                        |
| Deploy    | Docker: one self-contained image, no `node_modules` at runtime |
| Toolchain | Vite+ (`vp`): dev, build, test, lint, format, type check       |

## Getting started

```sh
vp install
vp run dev
```

Open http://localhost:5173.

## Environment

Each app loads the `.env` in its directory. Project creation wrote them with these values; git ignores them, so a fresh clone recreates them from here.

`apps/server/.env`

```dotenv
PORT=3000
```

## Commands

```sh
vp check          # format, lint, type check
vp run knip       # unused files, exports, dependencies, and catalog entries
vp test           # unit tests (Vitest)
vp run test:e2e   # end-to-end tests (Playwright) in Chromium, against the dev server
vp run ready      # check + knip + test + test:e2e + production build
```

The first `vp run test:e2e` needs a browser: `cd apps/web && vp exec playwright install chromium`.

## Production

```sh
docker compose up --build
```

This serves the API and the web app on http://localhost:3000. `node dist/index.mjs` serves `/api/health` and the SPA. It reads `PORT` (default `3000`).
