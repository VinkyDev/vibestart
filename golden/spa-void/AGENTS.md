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

## Code

Converge on the simplest durable design that meets current requirements, and land it directly. The change you land is the design that stays.

- Make routine judgment calls yourself. Ask when readings of the request lead to materially different work; when no one can answer, take the reading the code supports and state it in your report.
- Fix the root cause at the abstraction that owns it. Carry the change through every layer it touches, and leave unrelated areas intact.
- Open with a tracer bullet: the smallest end-to-end slice that works, grown in complete layers. Add a concept, configuration option, or extension point only for a use case that exists now.
- One representation, one execution path. Move every in-repository consumer to the final interface, and delete the obsolete API, schema, implementation, configuration, tests, and documentation in the same change. The final interface stands alone: no adapter, deprecated alias, dual read or write, fallback, feature flag, or migration layer beside it.
- A compatibility path exists only for a verified external constraint: a deployed consumer, a public contract, persisted production data, or a staged rollout. An assumed consumer is not a constraint. Isolate the path, name the condition that removes it, and let the final state shape the core. When production state cannot change atomically, ship an explicit, reversible migration with a defined end.
- Validate untrusted data where it enters, then trust it. Type it as `unknown`, narrow it with a schema or a type guard, and make invalid states unrepresentable so later code does not re-check them. `any` is not a type in this repo. Back every type assertion and non-null assertion with a runtime check or a stated invariant. Catch an error only where you recover from it or add context; let the rest propagate.
- Names carry the meaning. A comment states a why the code cannot: an external constraint, counterintuitive behavior, an invariant, or a tradeoff. It speaks to the next reader, never about the change, its history, or its reviewer. Delete a comment that restates the code or has gone stale.
- Lint serves the design. When a rule's concern applies, fix the code. When a rule misfires on the idiom a library documents, keep the idiom and turn the rule off for that library's files in a `lint.overrides` entry in `vite.config.ts`, with a comment naming the idiom.
- Reuse before you write: search the repo's own modules, then its dependencies, their docs, and their types. Otherwise add one mature, maintained library when it lowers total complexity or raises reliability, at the latest stable version the toolchain accepts, and follow its current docs. One library per capability; a few lines of domain logic stay inline.

## Map

| Path                | Owns                                                                              |
| ------------------- | --------------------------------------------------------------------------------- |
| `apps/web`          | React SPA: TanStack Router file routes, TanStack Query; e2e tests in `tests/e2e/` |
| `packages/ui`       | shadcn/ui components (Base UI), Tailwind theme in `src/styles/globals.css`        |
| `scripts/deploy.ts` | Void deployment                                                                   |
| `packages/config`   | Shared TypeScript presets                                                         |

`vp run dev` serves the app on :5173. `vp run build` writes static files to `apps/web/dist`; there is no server.

## Conventions

- **UI.** From `packages/ui`, run `pnpm dlx shadcn@latest add <component>` and import `@my-app/ui/components/<name>`. Files in `packages/ui/src/components` are vendored shadcn and are not linted. App code is checked by `@shadcn/lint`: style a component through its variants, and use `className` on it only for layout. When the first file lands in `src/hooks`, add `"./hooks/*": "./src/hooks/*.ts"` to the package exports (`components.json` already aliases that path).
- **Void.** Deploy with `vp run deploy`. Commit `void.lock.json`.
- **Generated.** `routeTree.gen.ts` is tool output. Leave it unchanged.
- **Utilities.** Import shared helpers from [es-toolkit](https://es-toolkit.dev/llms.txt), from the submodule the docs name (`import { retry } from "es-toolkit/function"`). `es-toolkit/compat` stays out.
- **Knip.** Delete what `vp run knip` reports: unused files, exports, dependencies, and catalog entries. Add a Knip config entry only when a plugin cannot see a real reference.
- **Ultracite.** Run `vp check` to apply the Ultracite lint and formatting presets, including framework rules and anti-slop checks for AI-written code. Fix the reported code instead of disabling the rules.

## Tests

A test earns its upkeep when its expected values come from a source independent of the code: the request, an acceptance criterion, a documented contract, or a domain rule, written down before the implementation. A test derived from reading the implementation restates it and catches nothing.

- Cover a change with the broadest test that reaches it. End-to-end journeys and integration tests through the real stack carry most of the confidence; a unit test is for dense logic with many cases: calculations, parsers, state machines, permissions.
- Test behavior at the boundary that owns it: the exported API, the command, the route or procedure, the page. A test that breaks under a behavior-preserving refactor is pinned to the implementation; move it to that boundary.
- Before adding a test, name the regression that makes it fail, and confirm no type, schema, lint rule, or existing test already catches it. Each contract has one owning test; extend its table of cases rather than adding a near-copy.
- Run this repo's own code for real. A fake stands in only for a service this repo does not run, with the reason next to it and a contract test that pins the request and response it imitates.
- Watch every new test go red before it goes green. A bug fix starts from a test that reproduces the bug.
- When a test fails, fix the code. Change, skip, or weaken an assertion only when the specified behavior changed, and say so in your report.

| Layer      | Location                                                          | Runs against                                       | Write it for                                                                             |
| ---------- | ----------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| End-to-end | `apps/web/tests/e2e/*.e2e.ts`                                     | Playwright driving Chromium against the dev server | Journeys that decide whether the product works                                           |
| Unit       | `*.test.ts` beside the code in `apps/web/src` or `packages/*/src` | Node, no I/O                                       | Branching logic: pricing, permissions, state machines, parsers, calculations, edge cases |

`apps/web/tests/support/server.ts` starts the stack for the e2e tests on :3200 (`E2E_TEST_PORT`): `vp dev`. A second checkout runs its tests at the same time on another port.

Open and reload pages with `visit()` before clicking. Network idle does not prove hydration; controls that need client JavaScript must stay disabled until hydration completes. Assert with Playwright's web-first assertions (`toBeVisible`, `toHaveURL`, `toBeChecked`).

E2E tests in `apps/web/tests/e2e` are the specification: changing, skipping, or weakening an assertion takes the user's approval first.

While iterating, run the narrowest set that covers the change: `vp test --project unit`, `vp test --changed`, a single file, or `vp exec playwright test <file>` in `apps/web`.

## Done

The change is done when every modified path works end to end, every rule in this file holds in every modified file, and `vp run ready` passes.

Before you report it, review the whole diff in a fresh context when your tools allow one: read the failure and cleanup paths, a second run against existing state, and every caller of what changed, and fix what you find.
