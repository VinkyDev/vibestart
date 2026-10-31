# Verification

Three gates, each pinning something different:

- **Snapshots** (`vp test`): the setup commands and every file of every verified stack, in one file per owner. Each distinct content appears once, under the stacks that render it, so a template change is one hunk however many stacks render the template. `vp test -u` updates them.
- **Golden** (`vp test`): `golden/*` must match generator output byte for byte, and together they use every integration. `vp run stacks goldens` rewrites them.
- **Verification** (`vp run stacks verify`): generate, install, run `setup`, then `vp run ready` inside the project. A pass is a record of the output's SHA-256 fingerprint, time, and environment. A task whose fingerprint already has a record is skipped. Records count only from CI (see [CI](#ci)).

The fingerprint covers what `vp run ready` reads: every generated file except documentation (`*.md`), and the setup commands. It does not cover resolved dependency versions. "Verified" means it passed against the dependencies resolved at that moment; `vp run deps update` moves the pins, which changes the output of every stack they reach, so CI re-verifies the stacks that cover them.

## Coverage

Stacks share most of their output: a database changes `packages/db` and a few files that use it, and an Electron app changes the files of its own app. Running `vp run ready` in every stack repeats the same files hundreds of times, and each new choice multiplies the stacks. Verification therefore runs a set of stacks that covers the others, and a stack's record is the pass of the stack that covers it.

A **facet** is one thing `ready` exercises in an output (`coverage.ts`). A pass vouches for every facet of its output, and a stack is **covered** when every one of its facets has a pass:

- **Under pnpm**: each file `ready` reads, by path and content; each line of `pnpm-workspace.yaml`, whose catalog lists exactly the stack's dependencies; the setup commands; and every three of the stack's choices together, an empty kind included. A file is checked against its contexts, and a context is the choices that render the files beside it, so a bug that needs three choices to meet is still run.
- **Under Bun**: Bun and pnpm generate the same sources and tests (`bun-sources.test.ts`), so a Bun pass only vouches for what Bun installs: each dependency name, catalog range, override, and trusted package, and every two choices together.

`stacks plan` picks the runs: the goldens' pnpm tasks first, then, greedily, the stack that covers the most facets no pass has, the first label on a tie. Passes already recorded count first, so a template change runs only what covers the facets it changed. From an empty store, about a quarter of the stacks under pnpm and a few under Bun cover all of them (`verification-store.test.ts` holds the plan under half and a tenth).

`pull` records, for each stack, its fingerprint and a representative pass, the one it shares the most facets with; the CLI and the Studio show that pass. Coverage comes from the union of passes, so the representative alone may lack some of the stack's facets. A stack is covered only at the fingerprint `pull` saw, so a later output is unverified until the next `pull`.

Two classes stand outside the facets:

- **Add-ons.** Each stack is verified with the default add-ons. Dropping an add-on removes only its own files, dependencies, presets, and checks (`addons.test.ts`), so the record stands for any subset of the defaults. An add-on that edits business files or the runtime must bring its own coverage.
- **Docker.** A stack without a deployment differs from its Docker sibling by Docker's files alone (`deployment.test.ts`), so it reuses that sibling's snapshot and coverage. `ready` reads no Docker file, so Docker files and its deployment choice are no facets either. Void changes runtime files, so only Void stacks add `deployment=void` choice facets; existing Docker and undeployed facets stay identical.

## Running at scale

`verify` runs stacks concurrently (`--jobs`). Each takes its own e2e ports from 20000 through `E2E_TEST_PORT`, below the ephemeral ranges of Linux and macOS; integration tests run in process and listen on none. Database stacks reach their server at `STACKS_POSTGRES_URL`, `STACKS_MYSQL_URL`, or `STACKS_MONGODB_URL`.

## The store

A **task** is one stack on one platform: every verified stack on Linux under each package manager, and each golden also on Windows. A record is keyed by platform and fingerprint, so it vouches for an output wherever that output appears, and a Linux golden is an ordinary Linux task. On Windows, each golden needs its own record; on Linux, a task needs a record that covers it.

Records live on the orphan `verification` branch as `<platform>/<fingerprint>.json`. CI on `main` is its only writer, and a record, once written, is never rewritten, so writers never conflict. Runs on a developer's machine record nothing: a local `verify` is for debugging, and a pass on another machine says nothing about CI's environment.

`vp run stacks pull` clones the store and writes the records for the current output to `packages/integrations/verification.json`, which Git ignores. The CLI embeds that file when it is packed, so "Verified" needs no backend service; a build without it shows every stack unverified. `vp run stacks check` reports each task `CURRENT` (naming the covering task when it is another), `STALE`, or `MISSING` against that file and exits 1 unless all are current. Release runs `pull` and `check` before it packs, attaches the file to the GitHub release, and then POSTs the Studio deploy hook. That build downloads the attached file and compares its coverage fingerprints with the current generated output before exposing verification in the Studio. A different template revision remains unverified.

## CI

`.github/workflows/ci.yml` is one workflow for pull requests and `main`:

1. `ready` runs `vp run ready`.
2. `plan` collects evidence, pulls the store and that evidence, and prints the jobs for the fewest tasks whose passes cover every task no record covers. Linux tasks split across up to eight shards; the Windows tasks run on a single runner. A change that touches no generated output plans no job.
3. `verify` runs each planned job. Linux runs PostgreSQL 18, MySQL 8.4, and MongoDB 8 as service containers; Windows starts the PostgreSQL 17 its runner image ships, and installs MySQL 8.4 and MongoDB 7.0. A job uploads its passes as it goes, so a job that fails or times out keeps what it finished.
4. `studio` builds the Studio and checks mode switching in desktop and mobile Chromium; `effect` smoke-tests the production golden image, including repeated migrations and authenticated RPC.
5. `ci`, the one required check, passes when `ready`, `plan`, `studio`, and `effect` passed and `verify` passed or had nothing to run.
6. On `main`, `record` adds every pass that matches `main`'s output to the store.

**Evidence.** On a pull request, `plan` downloads the results of the branch's latest runs; on `main`, those of the pull request merged as that commit. A run re-uploads the results it reused, so the latest runs carry all of a branch's evidence. Only runs from this repository count: a fork controls the workflow its pull request runs. A result counts only when its platform and fingerprint match a task at the current output, so a stale branch or a later merge re-runs only what covers the facets that changed. Each `main` commit runs to the end instead of being cancelled, so no merge's evidence is dropped.

`verify` installs Chromium in each project with a browser test, through the project's own runner as its README says, so the browser build follows the runner version that project resolved rather than the registry's latest. A Linux job first installs Chromium's system libraries. Tests run once, and Vite+ owns the pnpm cache.

The Linux MongoDB service sets `GLIBC_TUNABLES=glibc.pthread.rseq=1`, keeping glibc in charge of rseq so MongoDB uses per-thread caches. MongoDB's per-CPU allocator is unsafe on kernels 6.19 through 7.0.13 ([SERVER-125742](https://jira.mongodb.org/browse/SERVER-125742)); remove the setting once every hosted runner kernel includes the fix. Database tests still run against the same MongoDB 8 service.
