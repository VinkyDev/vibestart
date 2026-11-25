<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Running Scripts

Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

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

`vibestart.jsonc` records the stack this project was created with. When it also records the `name` and `version` of the vibestart release that generated the project, the vibestart CLI maintains the project from it: `npx vibestart-cli add` adds a capability, and `npx vibestart-cli upgrade --dry-run` previews a template upgrade. Leave `vibestart.jsonc` as the CLI wrote it. An upgrade merges infrastructure files such as `package.json`, `vite.config.ts`, and this file, and lists template changes to starter source, which is yours to edit, as manual changes to port.

<!-- best-agents-md:start -->

## Code

- Read the relevant code before editing, and clean up anything your change leaves unused.
- Keep code cohesive, loosely coupled, and easy to follow. Abstract at the right level, reuse what already exists, and keep the implementation minimal without overengineering.
- Use existing dependencies or well-maintained libraries for solved problems instead of reinventing them. Check their current docs before use.
- Don't add or keep compatibility layers unless required. Remove dead code and replaced paths.
- Don't write comments unless the code can't explain itself, such as a hidden constraint, a workaround, or a non-obvious reason.
- When requirements are materially ambiguous or involve real trade-offs, surface your assumptions or ask instead of guessing silently.

## Tests

- Only write tests that catch real regressions. Don't test implementation details, constants, or what the type system already guarantees.
- Test real behavior through public interfaces. Prefer integration or end-to-end tests that cover real workflows when practical; use unit tests only for complex logic.
- Mock only external boundaries, never the code under test.

## Bug fixes

- Reproduce the bug with a minimal test when practical. Confirm it fails before the fix and passes after.
- Fix the root cause instead of masking symptoms with silent fallbacks or swallowed errors.
- After the fix, keep the test, merge it into existing tests, or delete it, based on its value.

## Done

- Run the project's checks and verify the affected behavior without weakening tests or disabling checks. Report what changed, how you verified it, and any unverified areas or pre-existing failures.

<!-- best-agents-md:end -->

## Map

| Path              | Owns                                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web`        | React SPA: TanStack Router file routes, TanStack Query, the Better Auth client; e2e tests in `tests/e2e/`                                          |
| `apps/server`     | Hono on Workers: request-scoped `db` and `auth` passed to `createApp`, oRPC at `/api/rpc`, OpenAPI and docs at `/api`, the built SPA in production |
| `packages/api`    | oRPC routers, `publicProcedure`, `protectedProcedure`, and the `AppRouter` type the web client is typed from                                       |
| `packages/db`     | Drizzle schema (`src/schema/`, including Better Auth tables), relations, migrations (`src/migrations/`), `createDb`                                |
| `packages/auth`   | Better Auth configuration (`createAuth`) and the `Session` type                                                                                    |
| `packages/ui`     | shadcn/ui components (Base UI), Tailwind theme in `src/styles/globals.css`                                                                         |
| `packages/config` | Shared TypeScript presets                                                                                                                          |

`vp run dev` serves the web app on :5173 and the API on :3000. Request flow: `apps/web` → `api.*` (`src/lib/api.ts`) → `POST /api/rpc/*` → `packages/api` procedure → Drizzle → PostgreSQL. In development Vite proxies `/api` (including `/api/auth`) to the server; in production the server serves the SPA itself. The browser only ever sees one origin, so session cookies are first-party and there is no CORS configuration. Keep it that way: `BETTER_AUTH_URL` is the browser-facing origin (`http://localhost:5173` in development), and Better Auth rejects auth requests whose `Origin` differs from it.

## Conventions

- **Environment.** Declare every server variable in `apps/server/env.ts` and list it, with a safe example value, under Environment in `README.md`. Keep real values in the ignored `.env` file. Code reads `env` from the Worker environment schema. The web app is shipped to the browser, so it holds no secret.
- **Procedure.** Add it on a router in `packages/api/src/routers/` and register that router in `packages/api/src/index.ts`. Validate input with Zod, read the database from `context.db`, and throw `ORPCError` for an expected failure. The web client takes the new type with no codegen step.
- **Schema.** Add or edit a table in `packages/db/src/schema/`, register a new table in `src/relations.ts`, and back each invariant with a constraint (`check`, `unique`, foreign keys) as well as Zod. Run `vp run db:generate` and commit the new folder under `src/migrations/`. A committed migration stays as generated. The Better Auth tables in `schema/auth.ts` match the fields Better Auth expects; read its docs before adding a plugin.
- **Authorization.** A procedure that reads or writes user data is a `protectedProcedure` and scopes every query by `context.session.user.id`. Someone else's row is `NOT_FOUND`, which does not reveal that the id exists. Each new protected procedure gets an integration test as an anonymous caller and as another user.
- **Protected page.** Put the route under `src/routes/_authenticated/`. The layout sends an anonymous visitor to `/login?redirect=…`. The session sits on the route context (`context.session`), loaded once per navigation in `__root.tsx` from `/api/auth/get-session`. This is an SPA: the page hide is UX, and the procedure is the security boundary. Sign-out clears the Query cache.
- **Proxy.** Better Auth rate-limits by client IP. Behind a reverse proxy, set `advanced.ipAddress` in `packages/auth` to the header that proxy sets. With no proxy, leave forwarding headers untrusted.
- **UI.** From `packages/ui`, run `pnpm dlx shadcn@latest add <component>` (Bun: `bunx --bun shadcn@latest add <component>`) and import `@my-app/ui/components/<name>`. Files in `packages/ui/src/components` and `packages/ui/src/hooks` are vendored shadcn and are not linted. App code is checked by `@shadcn/lint`: style a component through its variants, and use `className` on it only for layout.
- **Generated.** `routeTree.gen.ts` and `packages/db/src/migrations/**` are tool output. Leave them unchanged.
- **Utilities.** Import shared helpers from [es-toolkit](https://es-toolkit.dev/llms.txt), from the submodule the docs name (`import { retry } from "es-toolkit/function"`). `es-toolkit/compat` stays out.
- **Knip.** Delete what `vp run knip` reports: unused files, exports, dependencies, and catalog entries. Add a Knip config entry only when a plugin cannot see a real reference.
- **Ultracite.** Run `vp check` to apply the Ultracite lint and formatting presets, including framework rules and anti-slop checks for AI-written code. Fix the reported code instead of disabling the rules.

## Tests

| Layer       | Location                                                             | Runs against                                                                                                  | Write it for                                                                             |
| ----------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| End-to-end  | `apps/web/tests/e2e/*.e2e.ts`                                        | Playwright driving Chromium against the real web app, API, and PostgreSQL                                     | Journeys that decide whether the product works                                           |
| Integration | `packages/api/tests/integration/*.test.ts`                           | Vitest calling `appRouter` in process through `createRouterClient`, real sessions, a real PostgreSQL database | Every procedure's validation, error codes, authorization, and invariants                 |
| Unit        | `*.test.ts` beside the code in `apps/server/src` or `packages/*/src` | Node, no I/O                                                                                                  | Branching logic: pricing, permissions, state machines, parsers, calculations, edge cases |

`apps/web/tests/support/server.ts` starts the stack for the e2e tests on :3200 (`E2E_TEST_PORT`): a fresh PostgreSQL database, the real Hono server, and Vite in front, with the same proxy and origin as development. A second checkout runs its tests at the same time on another port. Each integration test file gets a database of its own from `createTestDatabase()` in `@my-app/db/testing`, migrated and removed when the file ends, so files run in parallel. Test databases are created beside `DATABASE_URL` from `apps/server/.env`, so the tests need PostgreSQL running. Tests sign up a new user with `signUp()`, so they share no rows.

Open and reload pages with `visit()` before clicking. Network idle does not prove hydration; controls that need client JavaScript must stay disabled until hydration completes. Assert with Playwright's web-first assertions (`toBeVisible`, `toHaveURL`, `toBeChecked`).

Integration tests call the procedures in this process, through the same middleware and validation as a request, with real Better Auth sessions and a real database.

E2E tests in `apps/web/tests/e2e` are the specification: changing, skipping, or weakening an assertion takes the user's approval first.

While iterating, run the narrowest set that covers the change: `vp test --project unit`, `vp test --project integration`, `vp test --changed`, a single file, or `vp exec playwright test <file>` in `apps/web`.

## Done

The change is done when every modified path works end to end, every rule in this file holds in every modified file, and `vp run ready` passes.
