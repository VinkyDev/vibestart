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

| Path              | Owns                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `apps/server`     | Hono on Node: `env`, the shared `db`, mounts `packages/api` at `/api`                                          |
| `packages/api`    | OpenAPI routes (`createApi`), their Zod schemas, the reference docs, and the `Api` type clients are typed from |
| `packages/db`     | Drizzle schema for SQLite (`src/schema/`), relations, migrations (`src/migrations/`), `createDb`               |
| `packages/config` | Shared TypeScript presets                                                                                      |

`vp run dev` serves the API on :3000. Request flow: client → `/api/*` → `packages/api` route → Drizzle → SQLite. The OpenAPI document is at `/api/openapi.json`, with reference docs at `/api`.

## Conventions

- **Environment.** Declare every server variable in `apps/server/src/env.ts` and add it to `apps/server/.env.example`. Code reads `env`. Node loads `.env` in development; production gets the variables from the platform. `DATABASE_URL` resolves from the `apps/server` directory.
- **Route.** Declare it with `createRoute` in a module under `packages/api/src/routes/`, with a Zod schema for every request part and every response status, and mount that module in `packages/api/src/index.ts`. Read the database from the `db` the routes are created with, and answer an expected failure with its declared status. The OpenAPI document and `hono/client`'s types follow with no codegen step.
- **Schema.** Add or edit a table in `packages/db/src/schema/`, register a new table in `src/relations.ts`, and back each invariant with a constraint (`check`, `unique`, foreign keys) as well as Zod. Run `vp run db:generate` and commit the new folder under `src/migrations/`. A committed migration stays as generated. SQLite stores booleans and timestamps as integers (`integer({ mode: "boolean" })`, `integer({ mode: "timestamp_ms" })`). The driver is synchronous: `db.run()` and the migrator return values; query builders (`select`, `insert`, …) are still awaited.
- **Generated.** `packages/db/src/migrations/**` is tool output. Leave it unchanged.
- **Utilities.** Import shared helpers from [es-toolkit](https://es-toolkit.dev/llms.txt), from the submodule the docs name (`import { retry } from "es-toolkit/function"`). `es-toolkit/compat` stays out.
- **Knip.** Delete what `vp run knip` reports: unused files, exports, dependencies, and catalog entries. Add a Knip config entry only when a plugin cannot see a real reference.
- **Ultracite.** Run `vp check` to apply the Ultracite lint and formatting presets, including framework rules and anti-slop checks for AI-written code. Fix the reported code instead of disabling the rules.

## Tests

Types, Zod at every procedure boundary, database constraints, lint, and CI catch whole classes of bugs before a test runs. When one of those can enforce a rule, enforce it there too.

Write what "working" means before the implementation: acceptance criteria, the procedure's input, output, and error contract, and the invariants. The expected value comes from that specification.

| Layer       | Location                                                             | Runs against                                                                                              | Write it for                                                                             |
| ----------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Integration | `packages/api/tests/integration/*.test.ts`                           | Vitest sending requests to `createApi` in process through the typed `hono/client`, a real SQLite database | Every route's validation, status codes, and response bodies                              |
| Unit        | `*.test.ts` beside the code in `apps/server/src` or `packages/*/src` | Node, no I/O                                                                                              | Branching logic: pricing, permissions, state machines, parsers, calculations, edge cases |

A module with no branching logic worth isolating is covered by its integration test.

Each integration test file gets a database of its own from `createTestDatabase()` in `@my-app/db/testing`, migrated and removed when the file ends, so files run in parallel. Test databases are SQLite files in the system temp directory with the real migrations applied. Tests create the rows they read and do not depend on each other's rows.

Integration tests send requests to `createApi` in this process, through the same routing and validation as the server, with a real database; nothing of this repo is mocked. A fake stands in only for a third-party service this repo does not run, with the reason next to it and a contract test that pins the request and response it imitates.

A test fails when the behavior it names is broken. For important logic, break the code on purpose and confirm a test fails. A bug fix starts from a test that reproduces the bug and fails.

While iterating, run the narrowest set that covers the change: `vp test --project unit`, `vp test --project integration`, `vp test --changed`, or a single file.

## Done

The change is done when every modified path works end to end, every rule in this file holds in every modified file, and `vp run ready` passes.
