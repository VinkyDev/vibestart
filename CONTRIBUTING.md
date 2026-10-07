# Contributing

Thanks for helping. Read [AGENTS.md](AGENTS.md) first: its rules apply to every change here and to every generated project.

## Setup

This repository uses [Vite+](https://viteplus.dev). Install `vp`, then:

```sh
vp install        # install dependencies
vp check          # format, lint, type check
vp test           # unit tests, generation contracts, and golden comparison
vp run knip       # unused files, exports, and dependencies
vp run ready      # all of the above
vp dev            # run the web Studio (from apps/web)
```

A change is done when `vp run ready` passes.

## Changing a template or an integration

```sh
vp run stacks goldens      # update only the representative golden projects
vp run ready              # check source, all generation contracts, and goldens
```

Push the pull request; CI automatically plans and verifies affected combinations. No verification records or full-matrix snapshots belong in a commit. Keep the golden diff reviewable; do not update expected output just to silence a failing test.

- Linux verifies canonical pnpm stacks and maximal Bun subjects. Windows verifies the eight golden projects in two batches. A stable `ci` check requires all planned tasks to pass.
- CI restores recent evidence, compares runtime inputs, toolchain, harness and platform, and carries the resolved dependency lock. Documentation-only generated README/AGENTS changes still appear in output diffs but do not invalidate runtime evidence. See [CI architecture](docs/architecture.md#ci).
- The run's `verification-plan` artifact contains the plan, full generated outputs and diffs against previous evidence. `verification` contains passing results and resolved locks; failed jobs retain logs and browser traces. CI never commits records back to a branch.
- To resume after an interrupted run, rerun CI or use `gh workflow run ci.yml --ref <branch>`. Completed tasks can be reused. Add `-f force=true` to refresh dependencies and rerun everything; the weekly run does this automatically.
- For local service verification, `vp run stacks verify '<pattern>'` uses PostgreSQL at `STACKS_POSTGRES_URL` (default `postgres://$USER@localhost:5432/postgres`), Chromium installed with `npx playwright install chromium`, and Bun 1.4.2. Results stay in ignored `.verification/`; they are not CI evidence.
- `vp run stacks smoke '<pattern>'` builds Hono projects and exercises real imports and in-memory HTTP handlers without listening on a port.
- Before building a verified CLI or Studio locally, run `vp run stacks restore && vp run stacks check` with authenticated `gh`. `check` requires complete current evidence and embeds it; without an embedded report, development builds show unverified. Releases require complete evidence and retain the report as a release asset. Deploy Studio from the `verified-builds` artifact, or run the restore/check commands before your deployment build; a checkout alone contains no verification data.

## Keeping dependencies current

A package has one range in this repository's catalog (`pnpm-workspace.yaml`), the generated catalog (`packages/integrations/src/catalog.ts`), and the `package.json` engines.

```sh
vp run deps                 # list pins behind the registry; exits 1 when one is
vp run deps update          # move every pin to its target, then refresh and verify what it reaches
vp run deps update hono     # only matching pins and the pins that follow them
```

`update` stops at the first failing step and leaves the moved pins in the working tree.

The `/update-deps` agent skill (`.agents/skills/update-deps`) runs this whole flow: branch, `vp run deps update`, `vp check`, and a pull request.

## Releasing the CLI

`vibestart-cli` is published only by `.github/workflows/release.yml`. Do not run `npm publish` from a machine: it publishes `package.json` as written, and `catalog:` dependencies then reach the registry unresolved (this shipped once as an uninstallable `0.1.0-beta.0`).

1. Set `version` in `apps/cli/package.json` and merge it to `main` with `vp run ready` passing.
2. Push a tag that equals the version: `git tag -a v0.1.0-beta.2 -m v0.1.0-beta.2 && git push origin v0.1.0-beta.2`.
3. The workflow runs `vp run ready`, packs with pnpm, and publishes through npm trusted publishing, with provenance and no token or one-time password. A prerelease suffix goes to the `beta` dist-tag, anything else to `latest`.
4. It then installs the published version with `npx` and `pnpm dlx`, and creates the GitHub release with generated notes.

Never move or delete a pushed tag, and never force-push `main`; fix a bad release with a new version and `npm deprecate` on the bad one. One-time setup: on npmjs.com, open `vibestart-cli` → Settings → Trusted publisher and add GitHub repository `VinkyDev/vibestart`, workflow `release.yml`.

## Pull requests

- Keep a change focused, and carry it through every layer it touches.
- Update the CLI skill (`skills/vibestart/`) and docs when commands, flags, or result states change.
- Run `vp run ready` before you push.
