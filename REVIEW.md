# Review instructions

A change here is code that writes other people's projects. Most of the cost of a bug lands in a project generated from it, after the PR merged and CI went green. Review against `AGENTS.md`; this file says what to look for beyond it and what to leave out.

## What Important means here

Important is a finding that would ship a broken or misleading project, break a published contract, or make "Verified" lie:

- Generated code that fails on a path CI does not run: a failure or cleanup path, a second run, Windows, a mobile client, an error or empty state in a UI template.
- A cache or memo that holds a rejected promise, a mutable shared value, or a key that misses an input.
- A change to the CLI's flags, `--json` fields, error codes, statuses, or exit codes that `skills/vibestart/` and `apps/web/content/docs/cli/` do not match. A renamed field is breaking for anyone who scripts the CLI.
- A change to the fingerprint inputs (generated files, setup commands, the preview schema) that the PR does not mention, since it re-verifies every stack it reaches.
- Docs or Studio text that says something the code does not do, or an `en` page whose `zh` sibling now says something else. Docs that lie are bugs here.
- Release and packaging: what `vp pm pack` publishes from `apps/cli`, `release.yml`, and anything that runs only on a tag.

Everything else, including a style or naming preference, is Nit at most.

## Always check

- A template change: is the helper's teardown in `finally`, and does it release what it acquired when the step before it throws? Read the failure path the same way you read the happy path.
- A new branch on `ctx.has(id)`: does every sibling of that id get the same decision? `rg 'ctx.has\("<sibling>"\)' packages/integrations/src` finds them.
- A new or changed integration: are the Studio messages in both languages, the goldens, and the docs carried along? `.agents/skills/add-integration/SKILL.md` lists every layer.
- Generated SQL, URLs, and identifiers: bounded length, quoted, and escaped for every database the template renders for.
- A bug fix: does it start from a test that fails without it, at the boundary that owns the behavior (`AGENTS.md`, Tests)? Name the class of bug and every other instance of it, so one round fixes them all.

## Evidence

Every finding cites `file:line` in the source, or the generated file and the stack that renders it. A claim about what code does comes from reading that code, never from a name. When a finding needs a runtime condition (Windows, a failed migration, a rejected request), name the condition.

## Do not report

- What CI enforces: format, lint, types, Knip, snapshot and golden equality, the `pins.test.ts` ranges.
- Generated and vendored files: `packages/integrations/src/__snapshots__/**`, `golden/**`, `packages/integrations/schema.json`, `apps/web/src/paraglide/**`, `apps/web/src/routeTree.gen.ts`, `pnpm-lock.yaml`, `packages/ui/src/components/**`, and skills pinned in `skills-lock.json` under `.agents/skills/`. Review the template or renderer that produces them instead.
- A fallback, retry, or fail-open path offered as a fix. `AGENTS.md` asks for one execution path; a build that fails keeps the last good deployment up.
- A finding already posted on this PR. On a later round, review only the commits since the last review.

## Cap the nits

At most three Nits per review. After three rounds on one PR, stop posting new Nits and say whether the approach itself should change.

## Summary

Start with the count: `N Important, M Nit`. When there is nothing to fix, say so in one line. Tag a bug the PR did not introduce as Pre-existing.
