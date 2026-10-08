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
vp run stacks pull         # fetch the records for the current output from the verification store
vp run stacks check        # report CURRENT, STALE, or MISSING records; read-only
vp run stacks verify       # run `vp run ready` in each stack without a current record; records nothing
```

- Push, and the pull request's CI verifies every stack your change reaches: on Linux every stack, on Windows the goldens. A change that alters no generated output, documentation included, verifies nothing. Records come only from CI and land on the `verification` branch when the pull request merges; nobody commits them.
- `stacks verify` reproduces a CI failure locally. It runs against real services: PostgreSQL at `STACKS_POSTGRES_URL` (default `postgres://$USER@localhost:5432/postgres`) and Chromium, which each project's browser runner installs before its tests. Bun stacks need Bun 1.4.2 or newer.
- `stacks check` and `stacks verify` take a name pattern and `--package-manager pnpm|bun`. `check` exits 1 when a record is stale or missing and never installs or writes.
- `vp test` and `vp run ready` need no records; `pull` is for the CLI and Studio builds and for `check`.
- Add representatives in `packages/integrations/src/goldens.ts`; see [CI architecture](docs/architecture.md#ci) for planning, evidence, and environment preparation.
- `vp run stacks smoke '<pattern>'` builds Hono projects and exercises real imports and in-memory HTTP handlers without listening on a port. It never writes verification records.

## Keeping dependencies current

A package has one range in this repository's catalog (`pnpm-workspace.yaml`), the generated catalog (`packages/integrations/src/catalog.ts`), and the `package.json` engines.

```sh
vp run deps                 # list pins behind the registry; exits 1 when one is
vp run deps update          # move every pin to its target, then refresh what it reaches
vp run deps update hono     # only matching pins and the pins that follow them
```

`update` stops at the first failing step and leaves the moved pins in the working tree.

The `/update-deps` agent skill (`.agents/skills/update-deps`) runs this whole flow: branch, `vp run deps update`, `vp check`, and a pull request.

## Releasing the CLI

`vibestart-cli` is published only by `.github/workflows/release.yml`. Do not run `npm publish` from a machine: it publishes `package.json` as written, and `catalog:` dependencies then reach the registry unresolved (this shipped once as an uninstallable `0.1.0-beta.0`).

1. Set `version` in `apps/cli/package.json` and merge it to `main` with `vp run ready` passing.
2. Push a tag that equals the version: `git tag -a v0.1.0-beta.2 -m v0.1.0-beta.2 && git push origin v0.1.0-beta.2`.
3. The workflow runs `vp run ready`, pulls the verification records and stops unless every stack has one at the current output, packs with pnpm, and publishes through npm trusted publishing, with provenance and no token or one-time password. A prerelease suffix goes to the `beta` dist-tag, anything else to `latest`.
4. It then installs the published version with `npx` and `pnpm dlx`, and creates the GitHub release with generated notes.

Never move or delete a pushed tag, and never force-push `main`; fix a bad release with a new version and `npm deprecate` on the bad one. One-time setup: on npmjs.com, open `vibestart-cli` → Settings → Trusted publisher and add GitHub repository `VinkyDev/vibestart`, workflow `release.yml`.

## Repository setup

- The `Protect main` ruleset requires the `ci` check from GitHub Actions, and requires a branch to be up to date before it merges, so the records of a pull request match `main`'s output after the merge. It also forbids deleting or force-pushing `main`.
- The `Protect verification store` ruleset forbids deleting or force-pushing `verification`; `record` only fast-forwards it. A personal repository cannot make GitHub Actions the branch's only writer, so do not push to it by hand.
- The Studio's Cloudflare build runs the `@vibestart/web` `build` script, which pulls the records before `vp build`. The repository secret `CLOUDFLARE_DEPLOY_HOOK` holds a Workers Builds deploy hook for `main` (Worker → Settings → Builds → Deploy Hooks); `record` calls it after it adds records.

## Pull requests

- Keep a change focused, and carry it through every layer it touches.
- Update the CLI skill (`skills/vibestart/`) and docs when commands, flags, or result states change.
- Run `vp run ready` before you push.
