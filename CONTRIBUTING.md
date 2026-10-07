# Contributing

Thanks for helping. Read [AGENTS.md](AGENTS.md) first: its rules apply to every change here and to every generated project.

## Setup

This repository uses [Vite+](https://viteplus.dev). Install `vp`, then:

```sh
vp install        # install dependencies
vp check          # format, lint, type check
vp test           # unit tests, snapshots, and golden comparison
vp run knip       # unused files, exports, and dependencies
vp run ready      # all of the above
vp dev            # run the web Studio (from apps/web)
```

A change is done when `vp run ready` passes.

## Changing a template or an integration

```sh
vp test -u                 # update the stack snapshots
vp run stacks goldens      # rewrite golden/*
vp run stacks check        # report CURRENT, STALE, or MISSING records; read-only
vp run stacks verify       # run `vp run ready` in each affected stack and record the result
```

- `stacks verify` runs against real services: PostgreSQL at `STACKS_POSTGRES_URL` (default `postgres://$USER@localhost:5432/postgres`) and a Playwright Chromium. Bun stacks need Bun 1.4.2 or newer.
- `stacks check` and `stacks verify` take a name pattern and `--package-manager pnpm|bun`. `check` exits 1 when a record is stale or missing and never installs or writes.
- `vp test` and `vp run ready` do not fail on outdated fingerprints; CI refreshes `verification.json` on `main`, and `stacks verify` does it locally. To verify a branch without running it locally, run `gh workflow run ci.yml --ref <branch>`; the workflow commits the records to that branch.
- CI also verifies every golden on Linux and Windows on pull requests, pushes to `main`, and manual runs. The matrix comes from `vp run stacks golden-matrix`; add representatives in `packages/integrations/src/goldens.ts`, not in the workflow. These jobs always run regardless of recorded fingerprints and do not commit verification records.
- `vp run stacks smoke '<pattern>'` builds Hono projects and exercises real imports and in-memory HTTP handlers without listening on a port. It never writes verification records.

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
