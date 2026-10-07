---
name: update-deps
description: Move the pinned dependencies to their latest targets, verify, and open a pull request.
disable-model-invocation: true
---

Land a dependency update as one reviewed pull request. Read "Keeping dependencies current" in `CONTRIBUTING.md` for what a pin is and how the three pin files stay in step.

1. **Branch.** Start from an up-to-date, clean `main`, then create `deps/update-<YYYY-MM-DD>`. Done when `git status` is clean on the new branch.
2. **Survey.** Run `vp run deps`. Exit 0 means every pin is at its target: report that and stop. Otherwise read the table; a major `bump` or a deprecated pin is where a breaking change hides.
3. **Update.** Run `vp run deps update`. It moves the pins, refreshes lockfiles and goldens, then runs `stacks verify` and `vp run ready`. When a step fails, the moved pins stay in the working tree: fix the cause at the abstraction that owns it (a template, an integration, a pin rule in `packages/integrations/src/deps`), then run `vp run deps update` again. Done when it prints `All repository and stack checks passed`.
   - `stacks verify` needs PostgreSQL and Playwright Chromium (see `CONTRIBUTING.md`). Without them, run `vp run deps update --skip-stack-verification`; CI verifies affected stacks on the PR and retains evidence as artifacts. Never commit verification records.
4. **Check.** Run `vp check` and `vp run ready`. Done when both pass on the final tree.
5. **Commit.** One commit, `chore(deps): update pinned dependencies`, authored as the configured git user with no `Co-authored-by` trailer. A tool that appends one gets bypassed with `git commit-tree`.
6. **Pull request.** Push the branch and run `gh pr create` against `main`. The body lists each moved pin as `name: old → new` with its bump, names every breaking change you handled and where, and states whether stack verification ran. Done when `gh pr view --json url` returns the URL; hand that URL to the user.
