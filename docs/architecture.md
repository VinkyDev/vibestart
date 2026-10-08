# Architecture

[AGENTS.md](../AGENTS.md) maps each package to what it owns. This document explains how they fit together and the decisions the code does not show.

## Packages

- `packages/core`: Blueprint schema, registry, resolver, generator, and the pure merge used by maintenance. It never touches the file system: `generate` returns a virtual file tree, so the browser and the CLI run the same resolver.
- `packages/integrations`: every integration and add-on, the `recommended` catalog, templates, the golden comparison, and the verification store.
- `apps/cli`: the `vibestart` command: prompts, flags, `--json`, writing files, running setup, and project maintenance.
- `apps/web`: the Studio, the documentation site, and the generator preview. `oxfmt` has only a native binding, so the build runs the generator and writes each stack's projects to one static JSON file, outside the JavaScript bundle, which the Studio fetches when it shows that stack.
- `golden/`: checked-in generated projects. Each is its own workspace and the expected output of the comparison tests.

## Model

**Kinds and stacks.** The registry declares an ordered list of kinds: `toolchain`, `frontend`, `framework`, `router`, `backend`, `api`, `database`, `orm`, `auth`, `ui`, `desktop`, `runtime`, `deployment`, `testing`. A kind is required or optional and may have a default. A stack maps kind to integration id. An integration lists the `formerIds` earlier releases wrote for it; a blueprint that names one reads as the current id, so existing projects keep upgrading. Kind order fixes the field order of `vibestart.jsonc` and the order in which contributions are collected.

**Blueprint.** `vibestart.jsonc` records `stack`, `addons`, `channel`, and an optional `packageManager`. Its Zod schema and the exported JSON Schema derive from the registry, so a new integration changes no schema.

**Add-ons.** Orthogonal extensions (Knip, Ultracite) are chosen independently of the stack and stay out of the resolver. The registry declares the defaults: omitting `addons` takes them, an explicit `[]` takes none. The CLI flag, the prompt, and the Studio read the same registry.

**App shape is not a kind.** It is a legal pairing of `framework` and `backend`, of which at least one is set:

| `framework`              | `backend` | Shape                                                                                                |
| ------------------------ | --------- | ---------------------------------------------------------------------------------------------------- |
| `spa`                    | `hono`    | Vite proxies `/api` (and `/rpc` with oRPC) in dev; Hono serves the built SPA in production           |
| `spa`                    | none      | A static SPA served by nginx                                                                         |
| `tanstack-start`, `next` | `self`    | The framework's own server                                                                           |
| `tanstack-start`, `next` | `hono`    | Two processes: route handlers forward `/api` and `/rpc` to Hono, so session cookies stay first-party |
| `tanstack-start`, `next` | none      | Server-rendered pages only, with no API or database                                                  |
| none                     | `hono`    | A backend alone, tested by integration tests                                                         |

`self` contributes nothing. It makes "has a backend" a value of the same kind in every shape, and frameworks branch on `ctx.has("self")`.

## Resolver

Integrations declare `provides` and `requires` as capability strings. Four rules:

1. A required kind has a value, and each `kindGroups` group (`framework` and `backend`) has at least one.
2. Every `requires` is provided by some integration in the stack.
3. A capability has at most one provider, so Next.js and TanStack Router (both `router`) exclude each other, as do Hono and `self` (both `http-server`).
4. An `auxiliary` integration exists only to satisfy another's `requires`; a static SPA cannot carry a Node runtime.

Each violation carries a `reason`. The suggested fix is found by enumeration: among all legal stacks, the one that differs from the current stack in the fewest kinds, optionally keeping the kind just changed. Legal stacks number in the hundreds, so enumeration is cheap and no constraint solver is needed.

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

Three gates, each pinning something different:

- **Snapshots** (`vp test`): the setup commands and every file of every verified stack, in one file per owner. Each distinct content appears once, under the stacks that render it, so a template change is one hunk however many stacks render the template. `vp test -u` updates them.
- **Golden** (`vp test`): `golden/*` must match generator output byte for byte, and together they use every integration. `vp run stacks goldens` rewrites them.
- **Verification** (`vp run stacks verify`): generate, install, run `setup`, then `vp run ready` inside the project. A pass is a record of the output's SHA-256 fingerprint, time, and environment. A task whose fingerprint already has a record is skipped. Records count only from CI (see [CI](#ci)).

The fingerprint covers what `vp run ready` reads: every generated file except documentation (`*.md`), and the setup commands. It does not cover resolved dependency versions. "Verified" means it passed against the dependencies resolved at that moment; `vp run deps update` moves the pins, which changes the output of every stack they reach, so CI re-verifies those stacks.

### Equivalence classes

Verification runs once per class of stacks that share a result:

- **Add-ons.** Each stack is verified with the default add-ons. Dropping an add-on removes only its own files, dependencies, presets, and checks (`addons.test.ts`), so the record stands for any subset of the defaults. An add-on that edits business files or the runtime must bring its own coverage.
- **Docker.** A stack without a deployment differs from its Docker sibling by Docker's files alone (`deployment.test.ts`), so it reuses that sibling's snapshot and record.
- **Bun.** Bun and pnpm generate identical sources and tests, differing in `package.json`, `pnpm-workspace.yaml`, `Dockerfile`, and `vibestart.jsonc` (`bun.test.ts`). A Bun verification therefore checks that a dependency set installs and runs under Bun. A stack reuses the record of the Bun subject whose dependencies include its own: a stack that no other covers (`bun-subject.test.ts` proves the inclusion). A stack counts as verified under Bun only when both its own pnpm record and its subject's Bun record match.

### Running at scale

`verify` runs stacks concurrently (`--jobs`). Each takes its own e2e ports from 20000 through `E2E_TEST_PORT`, below the ephemeral ranges of Linux and macOS; integration tests run in process and listen on none. PostgreSQL stacks use `STACKS_POSTGRES_URL`.

### The store

A **task** is one stack on one platform: every verified stack and Bun subject on Linux, and each golden also on Windows. A record is keyed by platform and fingerprint, so it vouches for an output wherever that output appears, and a Linux golden is an ordinary Linux task.

Records live on the orphan `verification` branch as `<platform>/<fingerprint>.json`. CI on `main` is its only writer, and a record, once written, is never rewritten, so writers never conflict. Runs on a developer's machine record nothing: a local `verify` is for debugging, and a pass on another machine says nothing about CI's environment.

`vp run stacks pull` clones the store and writes the records for the current output to `packages/integrations/verification.json`, which Git ignores. The CLI and the Studio embed that file when they are built, so "Verified" needs no backend service; a build without it shows every stack unverified. `vp run stacks check` reports each task `CURRENT`, `STALE`, or `MISSING` against that file and exits 1 unless all are current. Release runs `pull` and `check` before it packs, and attaches the file to the GitHub release.

### CI

`.github/workflows/ci.yml` is one workflow for pull requests and `main`:

1. `ready` runs `vp run ready`.
2. `plan` collects evidence, pulls the store and that evidence, and prints the jobs for the tasks no record covers. Linux tasks split across up to eight shards; the Windows tasks run on a single runner. A change that touches no generated output plans no job.
3. `verify` runs each planned job. Linux uses a PostgreSQL 18 service container; Windows starts the PostgreSQL 17 its runner image ships. A job uploads its passes as it goes, so a job that fails or times out keeps what it finished.
4. `ci`, the one required check, passes when `ready` and `plan` passed and `verify` passed or had nothing to run.
5. On `main`, `record` adds every pass that matches `main`'s output to the store, then triggers the Studio's deploy hook (`CLOUDFLARE_DEPLOY_HOOK`), since the build for that commit may have embedded the records before they existed.

**Evidence.** On a pull request, `plan` downloads the results of the branch's latest runs; on `main`, those of the pull request merged as that commit. A run re-uploads the results it reused, so the latest runs carry all of a branch's evidence. Only runs from this repository count: a fork controls the workflow its pull request runs. A result counts only when its platform and fingerprint match a task at the current output, so a stale branch or a later merge re-verifies only what changed. Each `main` commit runs to the end instead of being cancelled, so no merge's evidence is dropped.

`verify` installs Chromium in each project with a browser test, through the project's own runner as its README says, so the browser build follows the runner version that project resolved rather than the registry's latest. A Linux job first installs Chromium's system libraries. Tests run once, and Vite+ owns the pnpm cache.

## Package manager and runtime

`packageManager` defaults to pnpm. Core renders a pnpm workspace file or Bun workspaces with a catalog and install policy in the root manifest; Bun keeps the `catalog:` protocol and approves install scripts only through an explicit `trustedDependencies`.

The `runtime` kind adds Bun beside Node. Bun needs the Hono capability, so it is legal only in stacks with Hono. Full-stack frameworks and the Vite+ toolchain stay on Node, and Docker includes whichever runtimes the stack uses. Stack names gain `bun` for the runtime and `bun-pm` for the package manager, and a record vouches only for its own fingerprint.

Hono splits `src/app.ts` (routing) from `src/index.ts` (listen and shutdown), so both runtimes load the full module graph and answer requests without binding a socket. `stacks smoke` uses that boundary and never writes records.

The e2e runner keeps a parent-owned stdin pipe open, because Vite treats stdin EOF as shutdown outside CI. It installs the catalog's fixed Undici dispatcher and closes it on teardown.

Teardown stops server process trees before removing test databases. Windows uses bounded `taskkill` and exit waits, with direct-child termination if `taskkill` fails; a child that does not exit fails teardown. SQLite removal retries transient file locks.

## Project maintenance

`vibestart.jsonc` is the whole maintenance state. When the CLI generates a project, it passes its version to the generator, which records `name` and `version` in that file beside the choices. Previews, goldens, and verification generate without a version, so their output and fingerprints do not change with each release.

The merge base is regenerated, not stored. Generation is deterministic and npm releases are immutable, so the recorded release, given the recorded name and choices, reproduces the original templates. The running release generates its own; any other runs through the `snapshot` protocol (`npm exec vibestart-cli@<version> snapshot`), which every release keeps reading and writing in the same format. The CLI checks that the snapshot's identity and choices match what it asked for. `--to` selects the target the same way, and must name a release that records its version.

Commands: `create`, `add`, `upgrade`, `doctor`, and the `snapshot` protocol. `add` and `upgrade` compare the regenerated base, the current files, and the target output, and produce one plan. `packages/core` owns the pure line and JSONC merge, `packages/integrations` declares addable capabilities and the maintained scope, and `apps/cli/src/maintenance` owns release loading, project I/O, and commands. A capability has one template, shared by create and add.

Only infrastructure is merged: manifests, catalog, toolchain and config files, Git ignores, agent conventions, Docker files. The CLI writes `vibestart.jsonc` itself, only when its recorded data changes, and refuses a target release whose record omits its version. Starter business source belongs to the user: a template change to it is reported in the plan's `manual` list with the previous and target template, and never written. Replacing a stack choice is not an automatic migration.

Git is the record of a write. A write requires a clean worktree, so `git diff` shows exactly what it changed and `git restore . && git clean -fd` undoes it. Conflicts are written into the files with Git's markers, and the write stops before installation. Otherwise the CLI installs once and runs the selected checks; a failing check leaves the files written for the user to fix or undo.

## Decisions

- **Core stays off the file system.** Output is a virtual tree, so preview and CLI agree.
- **Contributions, not AST transforms.** One owner renders each shared file, which is what lets `add` merge correctly.
- **The resolver enumerates and explains.** Every refusal has a `reason` and the smallest fix.
- **Verification is static data.** CI keeps it on the `verification` branch, and the CLI and the Studio embed it at build, so "Verified" works offline and only CI's environment counts.
- **Tests follow risk.** Playwright or TesterArmy e2e covers the main path black-box against a real server and a test database of its own; Vitest integration tests call the API in process against a real database, one database per test file; unit tests go to dense logic; nothing of the project is mocked. The rules ship in each project's `AGENTS.md`.
