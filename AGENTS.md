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

vibestart generates a project from a stack. The generator and the projects it writes follow one toolchain: Vite+, pnpm catalog, `@vibestart/config` TypeScript presets, Oxlint, and Knip. A web app for this repo will live in `apps/*` and extend `@vibestart/config/typescript/react.json`.

The rules under Code are the text of `packages/integrations/src/vite-plus/agents-code.md`. A change to the rules changes both, and every generated project receives that file's text.

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

| Path                    | Owns                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `apps/cli`              | The `vibestart` CLI: prompts, flags, `--json`, writing the project and running its setup          |
| `packages/core`         | Blueprint schema, resolver, and generator. Core returns a virtual file tree                       |
| `packages/integrations` | Integrations, the catalog, templates, golden comparison, and the verification store               |
| `packages/config`       | Shared TypeScript presets: `typescript/node.json` for Node, `typescript/react.json` for a web app |
| `golden/`               | Checked-in generated projects. Each is its own workspace and runs its own `vp check`              |

## Conventions

- **CLI skill.** Keep `skills/vibestart/` and the CLI documentation aligned with changes to commands, flags, result states, and recovery behavior. The skill is distributed independently of the CLI; it must discover the running release's capabilities.

- **Lint.** Templates and `golden/` are linted as generated output, so `vp run stacks verify` is where a template meets the rules. In this repo, turn a misfiring rule off in `lint.overrides` of the root `vite.config.ts`. In a generated project, the integration that owns the library contributes `lintOverrides`.
- **TypeScript.** A package extends `@vibestart/config` and lists it as a devDependency. Node code uses `typescript/node.json`. Web code uses `typescript/react.json`.
- **Utilities.** Import shared helpers from [es-toolkit](https://es-toolkit.dev/llms.txt), from the submodule the docs name (`import { retry } from "es-toolkit/function"`). `es-toolkit/compat` stays out.
- **Dependencies.** A package has one range across `pnpm-workspace.yaml`, the generated catalog in `packages/integrations/src/catalog.ts`, and the `package.json` engines, and `src/deps/pins.test.ts` holds them to it. Move versions with `vp run deps update`; CI on the pull request verifies every stack they reach.
- **Knip.** Delete what `vp run knip` reports: unused files, exports, dependencies, and catalog entries. Add a Knip config entry only when a plugin cannot see a real reference.

## Tests

`vp test` runs the Vitest files beside the code in `packages/core` and `packages/integrations`. Snapshots in `packages/integrations/src/__snapshots__` pin the generated tree of every verified stack, one file per owner with each distinct file once under the stacks that render it, and tests compare `golden/` to that output. A stack without a deployment is verified as its Docker sibling (`deployment.test.ts`). Under Bun, `stacks verify` installs only the stacks no other stack covers (`bun-subject.test.ts`). A golden project's `vp run ready` is a local check, outside `vp test`.

Generated projects ship no GitHub Actions. `.github/workflows/ci.yml` runs `vp run ready` on every push and pull request, and runs `vp run ready` inside each task whose output no record vouches for: every stack on Linux, the goldens also on Windows. Records live on the `verification` branch, which only CI on `main` writes; the passes of a pull request from this repository carry over to `main` at the merge. `ci` is the one required check (see `docs/architecture.md`).

A template change updates the snapshot and, when a golden project renders that template, the files in `golden/`. A local `vp run stacks verify` is for debugging and records nothing. `vp run stacks pull` writes the records for the current output to the ignored `packages/integrations/verification.json`, which the CLI and the Studio embed.

## Done

The change is done when every modified path works end to end, every rule in this file holds in every modified file, and `vp run ready` passes.
