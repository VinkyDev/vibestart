# Architecture

[AGENTS.md](../AGENTS.md) maps each package to what it owns. This document explains how they fit together and the decisions the code does not show.

## Packages

- `packages/core`: Blueprint schema, registry, resolver, generator, and the pure merge used by maintenance. It never touches the file system: `generate` returns a virtual file tree, so the browser and the CLI run the same resolver.
- `packages/integrations`: every integration and add-on, the `recommended` catalog, templates, the golden comparison, and the verification store.
- `apps/cli`: the `vibestart` command: prompts, flags, `--json`, writing files, running setup, and project maintenance.
- `apps/web`: the Studio, the documentation site, and the generator preview. `oxfmt` has only a native binding, so the build runs the generator and writes each stack's projects to one static JSON file, outside the JavaScript bundle, which the Studio fetches when it shows that stack.
- `golden/`: checked-in generated projects. Each is its own workspace and the expected output of the comparison tests.

## Model

**Kinds and stacks.** The registry declares an ordered list of kinds: `mode`, `toolchain`, `frontend`, `framework`, `router`, `backend`, `api`, `database`, `orm`, `auth`, `ui`, `desktop`, `mobile`, `runtime`, `deployment`, `testing`. A kind is required or optional and may have a default. A stack maps kind to integration id. An integration lists the `formerIds` earlier releases wrote for it; a blueprint that names one reads as the current id, so existing projects keep upgrading. Kind order fixes the field order of `vibestart.jsonc` and the order in which contributions are collected.

**Modes.** Standard is the default. Effect permits the reviewed SPA and Effect HTTP/RPC on Node, with Playwright or e2e. Persistence is optional: PostgreSQL or SQLite uses its native Effect SQL client and Drizzle adapter. Better Auth requires persistence and can be omitted; without a database, ORM and auth are absent and the example exposes HTTP/RPC health checks. Docker is optional. The mode is a registry choice shared by CLI prompts, Studio filtering, and validation. Creation fills missing required defaults; maintenance preserves historical inputs until the selected release generates them.

**Blueprint.** `vibestart.jsonc` records `stack`, `addons`, `channel`, and an optional `packageManager`. Its Zod schema and the exported JSON Schema derive from the registry, so a new integration changes no schema.

**Add-ons.** Orthogonal extensions (Knip, Ultracite) are chosen independently of the stack and stay out of the resolver. The registry declares the defaults: omitting `addons` takes them, an explicit `[]` takes none. The CLI flag, the prompt, and the Studio read the same registry.

**App shape is not a kind.** It is a legal pairing of `framework` and `backend`. At least one of them is set, unless the stack has a mobile app:

| `framework`              | `backend`     | Shape                                                                                                |
| ------------------------ | ------------- | ---------------------------------------------------------------------------------------------------- |
| `spa`                    | `effect-http` | Effect HTTP serves Effect RPC and the built SPA; Vite proxies both API paths in development          |
| `spa`                    | `hono`        | Vite proxies `/api` (and `/rpc` with oRPC) in dev; Hono serves the built SPA in production           |
| `spa`                    | none          | A static SPA served by nginx                                                                         |
| `tanstack-start`, `next` | `self`        | The framework's own server                                                                           |
| `tanstack-start`, `next` | `hono`        | Two processes: route handlers forward `/api` and `/rpc` to Hono, so session cookies stay first-party |
| `tanstack-start`, `next` | none          | Server-rendered pages only, with no API or database                                                  |
| none                     | `hono`        | A backend alone, tested by integration tests                                                         |

A mobile app (`mobile`: `expo`) joins any of these shapes or stands alone. With a backend, it calls the API on port 3000 of the machine Metro runs on in development, which is Hono or the framework that forwards to it, and the origin in `EXPO_PUBLIC_API_URL` in a release build. Docker requires a web app or an HTTP server, so a mobile app alone has no deployment.

`self` contributes nothing. It makes "has a backend" a value of the same kind in every shape, and frameworks branch on `ctx.has("self")`.

## Resolver

Integrations declare `provides` and `requires` as capability strings. Five rules:

1. A required kind has a value, and each `kindGroups` group (`framework`, `backend`, and `mobile`) has at least one.
2. Every `requires` is provided by some integration in the stack. A requirement may list alternatives, any one of which satisfies it: Docker needs a web app or an HTTP server to put in the image.
3. A capability has at most one provider, so Next.js and TanStack Router (both `router`) exclude each other, as do Hono and `self` (both `http-server`).
4. An `auxiliary` integration exists only to satisfy another's `requires`; a static SPA cannot carry a Node runtime. A requirement another alternative already meets does not count, so Docker beside Next.js does not justify `self`.

5. An integration may restrict another kind through `choices`, an allowlist of integration IDs or `null`. Modes use these constraints to keep ecosystems separate; repairs can preserve both the mode and the edited kind.

Each violation carries a `reason`. The suggested fix is found by enumeration: among all legal stacks, the one that differs from the current stack in the fewest kinds, optionally keeping the kind just changed. Legal stacks number in the thousands out of hundreds of thousands of combinations, so `legalStacks` searches the kinds depth-first and drops a branch once a violation no later kind can remove appears; the legal stacks are then few enough to compare directly, and no constraint solver is needed.

## Contributions

`contribute(ctx)` returns contributions:

- `file(path, content)` and `renderFile(path, read => content)`: the file belongs to the integration that returns it, and a path claimed twice is an error. `renderFile` runs after all slots are collected and may read any slot.
- `contribute(slot, value)`: appends a value to a slot.

A **slot** is a typed, additive channel defined by whoever owns the target file. Core owns `packageJson` and renders every `package.json` and the workspace file; `vite-plus` owns lint presets, generated-file lists, `AGENTS.md` rows, and the README. An integration never edits another's file, so a new integration changes no existing one. Integrations contribute in kind order, then add-ons in registry order.

Content that varies with the stack inside one owner's file branches on `ctx.has(id)`; it does not become a slot. `ctx.has` throws for an id the registry lacks.

Dependencies are written as names only. A name under the project scope becomes `workspace:*` and any other becomes `catalog:`, with versions from the registry catalog.

Generated code uses the idiom a library documents. When a lint rule misfires on it, the integration that owns the library contributes `lintOverrides` for that library's files, and the generated `vite.config.ts` names the idiom.

## Templates and rendering

- Static files live in `packages/integrations/templates/<owner>/<set>/<output path>`, where the owner is an integration or, for the two testing integrations, `testing`, and are read with `import.meta.glob(..., { query: "?raw" })`. The `common` set always ships; other sets depend on the stack. A template is a file of a project named `my-app`, and the name is replaced on output.
- Files that vary are rendered in TypeScript. A file that differs in one place stays a template, and its owner rewrites that place with an assertion that it matches.
- Templates hold no dot-files, because Vite's glob skips them; those are small and rendered in code.
- Output derived from other files, or stamped with the time of creation, is a `setup` command run after writing: `vp install` writes the lockfile, `vp build apps/web` writes the route tree, `vp run db:generate --name init` writes the first migration. Each command declares the paths it writes, and the golden comparison skips them.
- `generate` ends by formatting every file with the project's own `oxfmt`, so templates and renderers only need correct code.

## Verification

[Verification](verification.md) explains fingerprints, coverage facets, the verification store, and CI. Standard and Effect stacks use the same matrix; records apply only to the generated output they cover.

## Package manager and runtime

[Runtime architecture](runtime.md) covers package managers, Node/Bun and Workers, test-server teardown, and Void deployment.

## Project maintenance

`vibestart.jsonc` is the whole maintenance state. When the CLI generates a project, it passes its version to the generator, which records `name` and `version` in that file beside the choices. Previews, goldens, and verification generate without a version, so their output and fingerprints do not change with each release.

The merge base is regenerated, not stored. Generation is deterministic and npm releases are immutable, so the recorded release, given the recorded name and choices, reproduces the original templates. The running release generates its own; any other runs through the `snapshot` protocol (`npm exec vibestart-cli@<version> snapshot`), which every release keeps reading and writing in the same format. The CLI checks that the snapshot's identity and choices match what it asked for. `--to` selects the target the same way, and must name a release that records its version.

Commands: `create`, `add`, `upgrade`, `doctor`, and the `snapshot` protocol. `add` and `upgrade` compare the regenerated base, the current files, and the target output, and produce one plan. `packages/core` owns the pure line and JSONC merge, `packages/integrations` declares addable capabilities and the maintained scope, and `apps/cli/src/maintenance` owns release loading, project I/O, and commands. A capability has one template, shared by create and add.

Only infrastructure is merged: manifests, catalog, toolchain and config files, Git ignores, agent conventions, Docker files. The CLI writes `vibestart.jsonc` itself, only when its recorded data changes, and refuses a target release whose record omits its version. Starter business source belongs to the user: a template change to it is reported in the plan's `manual` list with the previous and target template, and never written. Replacing a stack choice is not an automatic migration. Adding a capability may fill an auxiliary choice the project left open, such as the Workers runtime of a SPA without a server, but `add` refuses to change a choice already made. Void config, env schema, Worker declarations and deploy script are infrastructure. `void.lock.json` is user-owned deployment state and is never generated or merged.

Git is the record of a write. A write requires a clean worktree, so `git diff` shows exactly what it changed and `git restore . && git clean -fd` undoes it. Conflicts are written into the files with Git's markers, and the write stops before installation. Otherwise the CLI installs once and runs the selected checks; a failing check leaves the files written for the user to fix or undo.

## Decisions

- **Core stays off the file system.** Output is a virtual tree, so preview and CLI agree.
- **Contributions, not AST transforms.** One owner renders each shared file, which is what lets `add` merge correctly.
- **The resolver enumerates and explains.** Every refusal has a `reason` and the smallest fix.
- **Verification is static data.** CI keeps it on the `verification` branch, and the CLI and the Studio embed it at build, so "Verified" works offline and only CI's environment counts.
- **Tests follow risk.** Playwright or TesterArmy e2e covers the main path black-box against a real server and a test database of its own; Vitest integration tests call the API in process against a real database, one database per test file; unit tests go to dense logic; nothing of the project is mocked. The rules ship in each project's `AGENTS.md`.
