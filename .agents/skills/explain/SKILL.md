---
name: explain
description: Explain how a slice of this repository works, from the current code. Use before changing a module you have not read, or when asked how something works, why it is built this way, or where a behavior lives.
---

An explainer is read once, so it trades completeness for the path a reader follows. Ground every claim in the code as it is now.

1. **Frame.** Turn the request into one question and name the entry point: a CLI command (`apps/cli/src/cli.ts`), a generator call (`generate` in `packages/core/src/generator.ts`), a `vp run stacks` subcommand (`packages/integrations/src/stacks.ts`), a Studio route (`apps/web/src/routes/`), or a CI job (`.github/workflows/ci.yml`). `AGENTS.md` (Map) and `docs/architecture.md` say which package owns what. Done when you can say the question in one sentence and point at the file where the path starts.
2. **Trace.** Follow the path from the entry point to its effect: reading files, calling functions, and checking the test that owns each step. Note each place it branches on a choice (`ctx.has`, a kind, a package manager, a platform). Done when every step of the path has a `file:line`.
3. **Explain.** Lead with a call tree or data-flow sketch of that path, then a short paragraph per step: what it owns, the invariant it keeps, and the decision `docs/architecture.md` records for it. Use the terms in `GLOSSARY.md`. End with the test to read or run to see it work, and what a change here reaches (stacks, goldens, the Studio, the CLI skill). When the reader asks for a visual, render the sketch as a diagram.
4. **Report drift.** When the code contradicts `docs/architecture.md`, `AGENTS.md`, or `GLOSSARY.md`, say so and name the line. A stale document is a bug.
