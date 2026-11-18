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

The general coding standard comes from [best-agents-md](https://github.com/VinkyDev/best-agents-md). `packages/integrations/src/best-agents-md.md` is the pinned release, and the markers below and every generated project carry that file. To move the pin, replace the file with the new release's `AGENTS.md`, run its `bin/cli.js` from the repository root so these markers match, then refresh snapshots and goldens. `src/vite-plus/agents.test.ts` fails until the file, these markers, and the installed release are the same text.

## Context

Read what the task needs; each file owns its subject.

- `docs/architecture.md`: how a stack becomes a project and how output is verified, with the decisions behind it.
- `GLOSSARY.md`: the domain terms. Use them in code, tests, and reviews.
- `REVIEW.md`: what counts as Important in review and what to leave out.
- Skills in `.agents/skills/`: `explain` before changing a module you have not read, `add-integration` for a new stack choice, `update-deps` for versions, and `self-review` before a pull request. `self-review` dispatches the read-only `reviewer` agent in `.agents/agents/`.
- `docs/review-evals/`: bugs that reached `main`, kept to test review rules against.

<!-- best-agents-md:start -->

## Code

- Read the relevant code before editing, follow the user's instructions, and clean up anything your change leaves unused.
- Keep code highly cohesive and loosely coupled. Keep related logic in one place, and use as little code as possible.
- Abstract at the right level and reuse what already exists. Keep the architecture easy to follow, and avoid overengineering.
- Use well-maintained libraries for solved problems instead of reinventing them. Check their current docs before use.
- Don't add or keep compatibility layers unless required. Remove dead code and replaced paths.
- Don't write comments unless the code can't explain itself, such as a hidden constraint, a workaround, or a non-obvious reason.

## Tests

- Only write tests that catch real regressions. Don't test implementation details, constants, or what the type system already guarantees.
- Prefer end-to-end and integration tests that cover real user workflows. Use unit tests only for complex logic.
- Test real behavior through public interfaces. Mock only external boundaries, never the code under test.

## Bug fixes

- Reproduce the bug with a minimal test when practical. Confirm it fails before the fix and passes after.
- Fix the root cause, not the symptom.
- After the fix, keep the test, merge it into existing tests, or delete it, based on its value.

## Done

- Run the project's checks and verify the affected behavior. Report what changed, how you verified it, and what you couldn't verify.

<!-- best-agents-md:end -->

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

`vp test` runs the Vitest files beside the code in `packages/core` and `packages/integrations`. Snapshots in `packages/integrations/src/__snapshots__` pin the generated tree of every verified stack, one file per owner with each distinct file once under the stacks that render it, and tests compare `golden/` to that output. A stack without a deployment is verified as its Docker sibling (`deployment.test.ts`). A stack is verified when passes cover each of its facets: every file `vp run ready` reads and every three of its choices together under pnpm, every dependency and every two choices under Bun (`coverage.ts`, `bun-sources.test.ts`). A golden project's `vp run ready` is a local check, outside `vp test`.

Generated projects ship no GitHub Actions. `.github/workflows/ci.yml` runs `vp run ready` on every push and pull request, and runs `vp run ready` inside the fewest tasks whose passes cover every stack no record covers on Linux, and each golden also on Windows. Records live on the `verification` branch, which only CI on `main` writes; the passes of a pull request from this repository carry over to `main` at the merge. `ci` is the one required check (see `docs/architecture.md`).

A template change updates the snapshot and, when a golden project renders that template, the files in `golden/`. A local `vp run stacks verify` is for debugging and records nothing. `vp run stacks pull` writes the records for the current output to the ignored `packages/integrations/verification.json`, which the CLI and the Studio embed.

While iterating, run `vp test <file>` or `vp test --changed`. Refresh snapshots with `vp test -u` and goldens with `vp run stacks goldens`, then read the diff: it is the change every generated project receives.

## Done

The change is done when every modified path works end to end, every rule in this file holds in every modified file, and `vp run ready` passes.
