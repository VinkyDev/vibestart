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
- `vp test` and `vp run ready` do not fail on outdated fingerprints; CI refreshes `verification.json` on `main`, and `stacks verify` does it locally.
- `vp run stacks smoke '<pattern>'` builds Hono projects and exercises real imports and in-memory HTTP handlers without listening on a port. It never writes verification records.

## Keeping dependencies current

A package has one range in this repository's catalog (`pnpm-workspace.yaml`), the generated catalog (`packages/integrations/src/catalog.ts`), and the `package.json` engines.

```sh
vp run deps                 # list pins behind the registry; exits 1 when one is
vp run deps update          # move every pin to its target, then refresh and verify what it reaches
vp run deps update hono     # only matching pins and the pins that follow them
```

`update` stops at the first failing step and leaves the moved pins in the working tree.

## Pull requests

- Keep a change focused, and carry it through every layer it touches.
- Update the CLI skill (`skills/vibestart/`) and docs when commands, flags, or result states change.
- Run `vp run ready` before you push.
