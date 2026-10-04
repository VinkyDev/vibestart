<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# Project

The architecture this project was created with is recorded in `vibestart.jsonc`.

## Code

Converge on the simplest durable design that meets current requirements. Land it directly, unless a verified external constraint forces a staged path. The change you land is the design that stays.

- Fix the root cause at the abstraction that owns it. Carry the change through every layer it touches, and leave unrelated areas intact.
- Open with a tracer bullet: the smallest end-to-end slice that works. Grow it in complete layers, and add only what current requirements need.
- Use the fewest concepts, paths, configuration options, and extension points those requirements need. Add indirection for a use case that exists now.
- One representation, one execution path. Update every in-repository consumer to the final interface, and remove the obsolete API, schema, implementation, configuration, tests, and documentation in the same change. The core path is that final interface alone: no adapter, deprecated alias, dual read or write, fallback, feature flag, or migration layer beside it.
- A compatibility path exists only for a verified external constraint: a deployed consumer, a public contract, persisted production data, or a staged rollout. An assumed consumer is not a constraint. Isolate the path, name the condition that removes it, and let the final state shape the core. When production state cannot change atomically, ship an explicit, reversible migration with a defined end.
- Let small units and precise names carry the meaning. A comment states a why the code cannot: an external constraint, counterintuitive behavior, an invariant, or a tradeoff. Delete a comment that restates the code or has gone stale.
- Carry precise types across input, internal, and output boundaries. Validate untrusted data before use, and make invalid states unrepresentable so later code does not re-check them. Type unknown data as `unknown` and narrow it with a schema or a type guard. `any` is not a type in this repo. Back every type assertion and non-null assertion with a runtime check or a stated invariant.
- Lint serves the design. When a rule's concern applies, fix the code. When a rule misfires on the idiom a library documents, keep the idiom and turn the rule off for that library's files in a `lint.overrides` entry in `vite.config.ts`, with a comment naming the idiom.
- Before writing a helper or adding a package, read the dependencies already in the repo, their docs, and their types. Prefer one of those. Otherwise add one mature, widely used, maintained library when it lowers total complexity or raises reliability, at the latest stable version this toolchain accepts, and follow its current docs. One library per capability. Keep a few lines of domain logic inline when they are smaller than a new dependency.

## Map

| Path                | Owns                                                                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`          | React SPA: TanStack Router file routes, TanStack Query, the Better Auth client; e2e tests in `tests/e2e/`                                                      |
| `apps/server`       | Hono on Node: `env`, the shared `db` and `auth` instances, Better Auth at `/api/auth`, oRPC at `/rpc`, OpenAPI and docs at `/api`, the built SPA in production |
| `packages/api`      | oRPC routers, `publicProcedure`, `protectedProcedure`, and the `AppRouter` type the web client is typed from                                                   |
| `packages/db`       | Drizzle schema (`src/schema/`, including Better Auth tables), relations, migrations (`src/migrations/`), `createDb`                                            |
| `packages/auth`     | Better Auth configuration (`createAuth`) and the `Session` type                                                                                                |
| `packages/ui`       | shadcn/ui components (Base UI), Tailwind theme in `src/styles/globals.css`                                                                                     |
| `apps/desktop`      | Electron main and preload processes, the `https://app.localhost/` renderer server, IPC handlers, and electron-builder config                                   |
| `packages/electron` | The IPC contract: channel names, payload schemas, and the `window.desktop` type                                                                                |
| `packages/config`   | Shared TypeScript presets                                                                                                                                      |

`vp run dev` serves the web app on :5173 and the API on :3000. Request flow: `apps/web` → `api.*` (`src/lib/api.ts`) → `POST /rpc/*` → `packages/api` procedure → Drizzle → PostgreSQL. In development Vite proxies `/rpc` and `/api` (including `/api/auth`) to the server; in production the server serves the SPA itself. The browser only ever sees one origin, so session cookies are first-party and there is no CORS configuration. Keep it that way: `BETTER_AUTH_URL` is the browser-facing origin (`http://localhost:5173` in development), and Better Auth rejects auth requests whose `Origin` differs from it.

The desktop app wraps `apps/web`: `vp run dev` starts the web dev server and opens it in an Electron window; `vp run package:desktop` builds the web app and packages the installer with electron-builder. The window loads `https://app.localhost/`, an origin the main process answers itself from `apps/web/dist` with the SPA fallback. The packaged app forwards `/rpc` and `/api` to `API_ORIGIN` (default `http://localhost:3000`) while keeping the renderer's `Origin` header; `packages/auth` lists `https://app.localhost` in `trustedOrigins` for the packaged window. In development the window loads the Vite dev server, which proxies the same paths through :5173. Restart `vp run dev` after changing main or preload code. Main, preload, and the renderer share the IPC contract in `packages/electron`; the renderer reads it from `window.desktop`.

## Conventions

- **Environment.** Declare every server variable in `apps/server/src/env.ts` and add it to `apps/server/.env.example`. Code reads `env`. The web app is shipped to the browser, so it holds no secret.
- **Procedure.** Add it on a router in `packages/api/src/routers/` and register that router in `packages/api/src/index.ts`. Validate input with Zod, read the database from `context.db`, and throw `ORPCError` for an expected failure. The web client takes the new type with no codegen step.
- **Schema.** Add or edit a table in `packages/db/src/schema/`, register a new table in `src/relations.ts`, and back each invariant with a constraint (`check`, `unique`, foreign keys) as well as Zod. Run `vp run db:generate` and commit the new folder under `src/migrations/`. A committed migration stays as generated. The Better Auth tables in `schema/auth.ts` match the fields Better Auth expects; read its docs before adding a plugin.
- **Authorization.** A procedure that reads or writes user data is a `protectedProcedure` and scopes every query by `context.session.user.id`. Someone else's row is `NOT_FOUND`, which does not reveal that the id exists. Each new protected procedure gets an integration test as an anonymous caller and as another user.
- **Protected page.** Put the route under `src/routes/_authenticated/`. The layout sends an anonymous visitor to `/login?redirect=…`. The session sits on the route context (`context.session`), loaded once per navigation in `__root.tsx` from `/api/auth/get-session`. This is an SPA: the page hide is UX, and the procedure is the security boundary. Sign-out clears the Query cache.
- **Proxy.** Better Auth rate-limits by client IP. Behind a reverse proxy, set `advanced.ipAddress` in `packages/auth` to the header that proxy sets. With no proxy, leave forwarding headers untrusted.
- **UI.** From `packages/ui`, run `pnpm dlx shadcn@latest add <component>` and import `@my-app/ui/components/<name>`. Files in `packages/ui/src/components` are vendored shadcn and are not linted. App code is checked by `@shadcn/lint`: style a component through its variants, and use `className` on it only for layout. When the first file lands in `src/hooks`, add `"./hooks/*": "./src/hooks/*.ts"` to the package exports (`components.json` already aliases that path).
- **Generated.** `routeTree.gen.ts` and `packages/db/src/migrations/**` are tool output. Leave them unchanged.
- **Utilities.** Import shared helpers from [es-toolkit](https://es-toolkit.dev/llms.txt), from the submodule the docs name (`import { retry } from "es-toolkit/function"`). `es-toolkit/compat` stays out.
- **Knip.** Delete what `vp run knip` reports: unused files, exports, dependencies, and catalog entries. Add a Knip config entry only when a plugin cannot see a real reference.
- **Ultracite.** Run `vp check` to apply the Ultracite lint and formatting presets, including framework rules and anti-slop checks for AI-written code. Fix the reported code instead of disabling the rules.

## Tests

Types, Zod at every procedure boundary, database constraints, lint, and CI catch whole classes of bugs before a test runs. When one of those can enforce a rule, enforce it there too.

Write what "working" means before the implementation: acceptance criteria, the procedure's input, output, and error contract, and the invariants. The expected value comes from that specification.

| Layer       | Location                                                             | Runs against                                                                                                  | Write it for                                                                             |
| ----------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| End-to-end  | `apps/web/tests/e2e/*.e2e.ts`                                        | Playwright driving Chromium against the real web app, API, and PostgreSQL                                     | Journeys that decide whether the product works                                           |
| Integration | `packages/api/tests/integration/*.test.ts`                           | Vitest calling `appRouter` in process through `createRouterClient`, real sessions, a real PostgreSQL database | Every procedure's validation, error codes, authorization, and invariants                 |
| Unit        | `*.test.ts` beside the code in `apps/server/src` or `packages/*/src` | Node, no I/O                                                                                                  | Branching logic: pricing, permissions, state machines, parsers, calculations, edge cases |

A module with no branching logic worth isolating is covered by its integration or e2e test.

`apps/web/tests/support/server.ts` starts the stack for the e2e tests on :3200 (`E2E_TEST_PORT`): a fresh PostgreSQL database, the real Hono server, and Vite in front, with the same proxy and origin as development. A second checkout runs its tests at the same time on another port. Each integration test file gets a database of its own from `createTestDatabase()` in `@my-app/db/testing`, migrated and removed when the file ends, so files run in parallel. Test databases are created beside `DATABASE_URL` from `apps/server/.env`, so the tests need PostgreSQL running. Tests sign up a new user with `signUp()`, so they share no rows.

Open and reload pages with `visit()` (`waitUntil: "networkidle"`) before clicking. Server-rendered pages hydrate after load, and a click before hydration does nothing. Assert with Playwright's web-first assertions (`toBeVisible`, `toHaveURL`, `toBeChecked`).

Integration tests call the procedures in this process, through the same middleware and validation as a request, with real Better Auth sessions and a real database; nothing of this repo is mocked. A fake stands in only for a third-party service this repo does not run, with the reason next to it and a contract test that pins the request and response it imitates.

A test fails when the behavior it names is broken. For important logic, break the code on purpose and confirm a test fails. A bug fix starts from a test that reproduces the bug and fails. E2E tests in `apps/web/tests/e2e` are the specification: changing, skipping, or weakening an assertion takes the user's approval first.

While iterating, run the narrowest set that covers the change: `vp test --project unit`, `vp test --project integration`, `vp test --changed`, a single file, or `vp exec playwright test <file>` in `apps/web`.

## Done

The change is done when every modified path works end to end, every rule in this file holds in every modified file, and `vp run ready` passes.
