---
name: self-review
description: Review your own change before you open or update a pull request. Use when a change is ready to commit or push, or after fixing review findings.
---

Machines read a change before a person does. This skill runs the checks and a fresh-context review, then answers every finding.

1. **Evidence.** Run `vp run ready` and keep its last lines. A change that alters generated output also needs the snapshot and golden diff read: it is what every generated project receives. When the change reaches a template and its services are available, run `vp run stacks verify '<pattern>'` for one stack that renders it. Done when you hold output that shows the change working, not a claim that it does.
2. **Review in a fresh context.** Dispatch the `reviewer` subagent (`.agents/agents/reviewer.md`) with the diff range, or the changed paths when nothing is committed, and one paragraph of intent. It loads `REVIEW.md` itself. Done when it returns its count line.
3. **Answer every finding.** Fix each Important one at its root and every instance of its class, or record why it does not apply. A Nit is your call. Done when each finding is marked fixed or answered with a reason.
4. **Converge.** Re-run the reviewer on the commits since its last pass only. After three rounds, stop and reconsider the approach rather than patching further. Done when a round reports no Important finding.
5. **Fix the source.** When a finding is one a rule could have caught, or one you have seen before, put the fix where the next change meets it: a lint rule or test, a line in `REVIEW.md` or `AGENTS.md`, or a case in `docs/review-evals/cases.json`. Say which in the pull request.
6. **Pull request.** Write the body with the `pr` skill; `.github/pull_request_template.md` holds its sections. Evidence is the output from step 1. Done when Merge Danger names the door and the blast radius.
