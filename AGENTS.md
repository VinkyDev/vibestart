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

vibestart generates a project from a stack. The generator and the projects it writes follow one toolchain: Vite+, pnpm catalog, `@vibestart/config` TypeScript presets, Oxlint, and Knip. The Studio in `apps/web` is the web app; it extends `@vibestart/config/typescript/react.json`.

Code, the opening of Tests, and Done are the text every generated project receives: `packages/integrations/src/vite-plus/agents-code.md`, `packages/integrations/src/testing/agents-tests-intro.md`, and `packages/integrations/src/vite-plus/agents-done.md`. Change a rule in its file, and `src/vite-plus/agents.test.ts` holds this file to the same text.

## Context

Read what the task needs; each file owns its subject.

- `docs/architecture.md`: how a stack becomes a project and how output is verified, with the decisions behind it.
- `GLOSSARY.md`: the domain terms. Use them in code, tests, and reviews.
- `REVIEW.md`: what counts as Important in review and what to leave out.
- Skills in `.agents/skills/`: `explain` before changing a module you have not read, `add-integration` for a new stack choice, `update-deps` for versions, and `self-review` before a pull request. `self-review` dispatches the read-only `reviewer` agent in `.agents/agents/`.
- `docs/review-evals/`: bugs that reached `main`, kept to test review rules against.

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

| Path                    | Owns                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `apps/cli`              | The `vibestart` CLI: prompts, flags, `--json`, writing the project and running its setup          |
| `packages/core`         | Blueprint schema, resolver, and generator. Core returns a virtual file tree                       |
| `packages/integrations` | Integrations, the catalog, templates, golden comparison, and the verification store               |
| `packages/config`       | Shared TypeScript presets: `typescript/node.json` for Node, `typescript/react.json` for a web app |
| `apps/web`              | The Studio: the stack picker, previews of generated files, and the en/zh docs in `content/docs`   |
| `packages/ui`           | The Studio's shadcn components and styles                                                         |
| `golden/`               | Checked-in generated projects. Each is its own workspace and runs its own `vp check`              |
| `prototypes/`           | Hand-written targets for stacks not generated yet; each is a workspace                            |

## Conventions

- **CLI skill.** Keep `skills/vibestart/` and the CLI documentation aligned with changes to commands, flags, result states, and recovery behavior. The skill is distributed independently of the CLI; it must discover the running release's capabilities.

- **Lint.** Templates and `golden/` are linted as generated output, so `vp run stacks verify` is where a template meets the rules. In this repo, turn a misfiring rule off in `lint.overrides` of the root `vite.config.ts`. In a generated project, the integration that owns the library contributes `lintOverrides`.
- **TypeScript.** A package extends `@vibestart/config` and lists it as a devDependency. Node code uses `typescript/node.json`. Web code uses `typescript/react.json`.
- **Utilities.** Import shared helpers from [es-toolkit](https://es-toolkit.dev/llms.txt), from the submodule the docs name (`import { retry } from "es-toolkit/function"`). `es-toolkit/compat` stays out.
- **Dependencies.** A package has one range across `pnpm-workspace.yaml`, the generated catalog in `packages/integrations/src/catalog.ts`, `package.json`, and CI's `bun-version`, and `src/deps/pins.test.ts` holds them to it. Move versions with `vp run deps update`; CI on the pull request verifies every stack they reach.
- **Knip.** Delete what `vp run knip` reports: unused files, exports, dependencies, and catalog entries. Add a Knip config entry only when a plugin cannot see a real reference.

## Tests

A test earns its upkeep when its expected values come from a source independent of the code: the request, an acceptance criterion, a documented contract, or a domain rule, written down before the implementation. A test derived from reading the implementation restates it and catches nothing.

- Cover a change with the broadest test that reaches it. End-to-end journeys and integration tests through the real stack carry most of the confidence; a unit test is for dense logic with many cases: calculations, parsers, state machines, permissions.
- Test behavior at the boundary that owns it: the exported API, the command, the route or procedure, the page. A test that breaks under a behavior-preserving refactor is pinned to the implementation; move it to that boundary.
- Before adding a test, name the regression that makes it fail, and confirm no type, schema, lint rule, or existing test already catches it. Each contract has one owning test; extend its table of cases rather than adding a near-copy.
- Run this repo's own code for real. A fake stands in only for a service this repo does not run, with the reason next to it and a contract test that pins the request and response it imitates.
- Watch every new test go red before it goes green. A bug fix starts from a test that reproduces the bug.
- When a test fails, fix the code. Change, skip, or weaken an assertion only when the specified behavior changed, and say so in your report.

`vp test` runs the Vitest files beside the code in `packages/core` and `packages/integrations`. Snapshots in `packages/integrations/src/__snapshots__` pin the generated tree of every verified stack, one file per owner with each distinct file once under the stacks that render it, and tests compare `golden/` to that output. A stack without a deployment is verified as its Docker sibling (`deployment.test.ts`). A stack is verified when passes cover each of its facets: every file `vp run ready` reads and every three of its choices together under pnpm, every dependency and every two choices under Bun (`coverage.ts`, `bun-sources.test.ts`). A golden project's `vp run ready` is a local check, outside `vp test`.

Generated projects ship no GitHub Actions. `.github/workflows/ci.yml` runs `vp run ready` on every push and pull request, and runs `vp run ready` inside the fewest tasks whose passes cover every stack no record covers on Linux, and each golden also on Windows. Records live on the `verification` branch, which only CI on `main` writes; the passes of a pull request from this repository carry over to `main` at the merge. `ci` is the one required check (see `docs/architecture.md`).

A template change updates the snapshot and, when a golden project renders that template, the files in `golden/`. A local `vp run stacks verify` is for debugging and records nothing. `vp run stacks pull` writes the records for the current output to the ignored `packages/integrations/verification.json`, which the CLI and the Studio embed.

While iterating, run `vp test <file>` or `vp test --changed`. Refresh snapshots with `vp test -u` and goldens with `vp run stacks goldens`, then read the diff: it is the change every generated project receives.

## Done

The change is done when every modified path works end to end, every rule in this file holds in every modified file, and `vp run ready` passes.

Before you report it, review the whole diff in a fresh context when your tools allow one: read the failure and cleanup paths, a second run against existing state, and every caller of what changed, and fix what you find.
