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

| Path              | Owns                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `apps/server`     | Hono on Node: `env`, the shared `db` and `auth` instances, Better Auth at `/api/auth`, oRPC at `/rpc`, OpenAPI and docs at `/api` |
| `packages/api`    | oRPC routers, `publicProcedure`, `protectedProcedure`, and the `AppRouter` type clients are typed from                            |
| `packages/db`     | Mongoose schemas (`src/schema/`), index builds (`src/migrate.ts`), `createDb`                                                     |
| `packages/auth`   | Better Auth configuration (`createAuth`) and the `Session` type                                                                   |
| `apps/mobile`     | Expo Router screens, mobile UI components, and the Uniwind theme                                                                  |
| `packages/config` | Shared TypeScript presets                                                                                                         |

`vp run dev` serves the API on :3000. Request flow: client → `POST /rpc/*` → `packages/api` procedure → Mongoose → MongoDB. `/api/*` serves the same procedures as OpenAPI, with reference docs at `/api`.

The mobile app in `apps/mobile` runs on Expo with Expo Router: each file in `src/app` is a screen, and `_layout.tsx` holds the navigation stack. `vp run dev:mobile` starts Metro and prints a QR code for Expo Go. It runs beside `vp run dev`, in a terminal of its own, because Expo's terminal UI cannot share one. The app calls the server at the origin `src/env.ts` resolves: `EXPO_PUBLIC_API_URL` when it is set, otherwise, in development, port 3000 on the machine Metro runs on (`src/lib/api-url.ts`). A release build has no Metro, so it needs `EXPO_PUBLIC_API_URL`. Better Auth's Expo client (`src/lib/auth-client.ts`) keeps the session in SecureStore. Native fetch has no cookie jar, so `src/lib/api.ts` sends the session cookie itself. The server trusts `my-app://`, the app's scheme, as its origin. Uniwind compiles Tailwind classes for React Native; the theme is the CSS variables in `apps/mobile/global.css`. Unit tests run in Node, where `react-native` does not load, so they cover logic kept out of components, as `src/lib/api-url.test.ts` does. `vp run build` exports the iOS and Android bundles with `expo export`. A native module Expo Go does not ship needs a development build: `vp run --filter @my-app/mobile ios` or `android`.

## Conventions

- **Environment.** Declare every server variable in `apps/server/src/env.ts` and list it, with a safe example value, under Environment in `README.md`. Keep real values in the ignored `.env` file. Code reads `env`. Node loads `.env` in development; production gets the variables from the platform.
- **Procedure.** Add it on a router in `packages/api/src/routers/` and register that router in `packages/api/src/index.ts`. Validate input with Zod, read the database from `context.db`, and throw `ORPCError` for an expected failure. Clients typed from `AppRouterClient` take the new type with no codegen step.
- **Schema.** Each collection is a Mongoose schema in `packages/db/src/schema/`, registered as a model in `createDb`. MongoDB has no migrations: a new field is optional, or has a default, so documents written before it still read. `vp run db:migrate` builds the indexes the schemas declare; run it after adding or removing one. Queries return plain objects (`.lean()`). The API exposes an `ObjectId` as a 24-character hex string `id`; validate one with Zod before a query uses it. Better Auth's adapter owns the `user`, `session`, `account`, and `verification` collections; read its docs before adding a plugin.
- **Authorization.** A procedure that reads or writes user data is a `protectedProcedure` and scopes every query by `context.session.user.id`. Someone else's row is `NOT_FOUND`, which does not reveal that the id exists. Each new protected procedure gets an integration test as an anonymous caller and as another user.
- **Proxy.** Better Auth rate-limits by client IP. Behind a reverse proxy, set `advanced.ipAddress` in `packages/auth` to the header that proxy sets. With no proxy, leave forwarding headers untrusted.
- **Mobile.** Add a screen as a file in `apps/mobile/src/app`. Style React Native components with Tailwind classes in `className`, and reuse the components in `apps/mobile/src/components/ui`.
- **Protected screen.** A screen that needs a user is listed under a `Stack.Protected guard={signedIn}` in `apps/mobile/src/app/_layout.tsx`. The guard is UX, and the server is the security boundary.
- **Generated.** `apps/mobile/uniwind-types.d.ts` is tool output. Leave it unchanged. Metro rewrites it from the themes in `global.css`.
- **Utilities.** Import shared helpers from [es-toolkit](https://es-toolkit.dev/llms.txt), from the submodule the docs name (`import { retry } from "es-toolkit/function"`). `es-toolkit/compat` stays out.
- **Knip.** Delete what `vp run knip` reports: unused files, exports, dependencies, and catalog entries. Add a Knip config entry only when a plugin cannot see a real reference.
- **Ultracite.** Run `vp check` to apply the Ultracite lint and formatting presets, including framework rules and anti-slop checks for AI-written code. Fix the reported code instead of disabling the rules.

## Tests

| Layer       | Location                                                                                | Runs against                                                                                               | Write it for                                                                             |
| ----------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Integration | `packages/api/tests/integration/*.test.ts`                                              | Vitest calling `appRouter` in process through `createRouterClient`, real sessions, a real MongoDB database | Every procedure's validation, error codes, authorization, and invariants                 |
| Unit        | `*.test.ts` beside the code in `apps/server/src`, `apps/mobile/src` or `packages/*/src` | Node, no I/O                                                                                               | Branching logic: pricing, permissions, state machines, parsers, calculations, edge cases |

Each integration test file gets a database of its own from `createTestDatabase()` in `@my-app/db/testing`, migrated and removed when the file ends, so files run in parallel. Test databases are created beside `DATABASE_URL` from `apps/server/.env`, so the tests need MongoDB running. Tests sign up a new user with `signUp()`, so they share no rows.

Integration tests call the procedures in this process, through the same middleware and validation as a request, with real Better Auth sessions and a real database.

While iterating, run the narrowest set that covers the change: `vp test --project unit`, `vp test --project integration`, `vp test --changed`, or a single file.

## Done

The change is done when every modified path works end to end, every rule in this file holds in every modified file, and `vp run ready` passes.
