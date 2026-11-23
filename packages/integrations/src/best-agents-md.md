## Code

- Read the relevant code before editing, and clean up anything your change leaves unused.
- Keep code cohesive, loosely coupled, and easy to follow. Abstract at the right level, reuse what already exists, and keep the implementation minimal without overengineering.
- Use existing dependencies or well-maintained libraries for solved problems instead of reinventing them. Check their current docs before use.
- Don't add or keep compatibility layers unless required. Remove dead code and replaced paths.
- Don't write comments unless the code can't explain itself, such as a hidden constraint, a workaround, or a non-obvious reason.
- When requirements are materially ambiguous or involve real trade-offs, surface your assumptions or ask instead of guessing silently.

## Tests

- Only write tests that catch real regressions. Don't test implementation details, constants, or what the type system already guarantees.
- Test real behavior through public interfaces. Prefer integration or end-to-end tests that cover real workflows when practical; use unit tests only for complex logic.
- Mock only external boundaries, never the code under test.

## Bug fixes

- Reproduce the bug with a minimal test when practical. Confirm it fails before the fix and passes after.
- Fix the root cause instead of masking symptoms with silent fallbacks or swallowed errors.
- After the fix, keep the test, merge it into existing tests, or delete it, based on its value.

## Done

- Run the project's checks and verify the affected behavior without weakening tests or disabling checks. Report what changed, how you verified it, and any unverified areas or pre-existing failures.
