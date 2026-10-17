# Review evals

`cases.json` holds bugs that reached `main`. Each case names the commit that introduced the bug, the fix (empty while it is still open), and the finding a reviewer should make. Use it to check that a change to `REVIEW.md`, `.agents/agents/reviewer.md`, or `.coderabbit.yaml` still catches what it caught before.

## Run a case

Give the `reviewer` subagent the introducing commit, scoped to the case's paths, and nothing about the bug:

```sh
git diff <introduced>^ <introduced> -- <paths>
```

Ask it to review that diff against the tree at `<introduced>` (`git worktree add /tmp/eval <introduced>`). A case passes when the reviewer reports the expected finding as Important, at the file in `paths`. A case fails when the finding is missing, tagged Nit, or arrives buried among noise.

Score a run as caught out of total, plus the count of Important findings that are not the case's bug. Compare that score before and after the change to the review rules.

## Add a case

When a bug reaches `main` that review could have caught, add an entry after the fix lands: `introduced` from `git log -S` or `git blame`, `fixed` as the fixing commit, `expect` stating the runtime condition and its effect, and `class` matching a line in `REVIEW.md`. When no line in `REVIEW.md` names the class, add one.
