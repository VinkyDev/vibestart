# my-app

Hono · Node · Fly Machines, on [Vite+](https://viteplus.dev).

| Layer      | Choice                                                   |
| ---------- | -------------------------------------------------------- |
| Backend    | Hono on Node.js 26                                       |
| Deployment | Fly Machines with Alchemy (preview)                      |
| Toolchain  | Vite+ (`vp`): dev, build, test, lint, format, type check |

## Getting started

```sh
vp install
vp run dev
```

The server listens on http://localhost:3000, with its health at http://localhost:3000/api/health.

## Environment

Each app loads the `.env` in its directory. Project creation wrote them with these values; git ignores them, so a fresh clone recreates them from here.

`apps/server/.env`

```dotenv
PORT=3000
```

## Commands

```sh
vp check       # format, lint, type check
vp run knip    # unused files, exports, dependencies, and catalog entries
vp test        # unit tests (Vitest)
vp run ready   # check + knip + test + production build
```

## Production

Follow [the Fly Machines deployment guide](DEPLOYMENT.md) to publish an image, plan changes and deploy.
