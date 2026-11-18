## Code

- Read the relevant code before editing, follow the user's instructions, and clean up anything your change leaves unused.
- Keep code highly cohesive and loosely coupled. Keep related logic in one place, and use as little code as possible.
- Abstract at the right level and reuse what already exists. Keep the architecture easy to follow, and avoid overengineering.
- Use well-maintained libraries for solved problems instead of reinventing them. Check their current docs before use.
- Don't add or keep compatibility layers unless required. Remove dead code and replaced paths.
- Don't write comments unless the code can't explain itself, such as a hidden constraint, a workaround, or a non-obvious reason.

## Tests

- Only write tests that catch real regressions. Don't test implementation details, constants, or what the type system already guarantees.
- Prefer end-to-end and integration tests that cover real user workflows. Use unit tests only for complex logic.
- Test real behavior through public interfaces. Mock only external boundaries, never the code under test.

## Bug fixes

- Reproduce the bug with a minimal test when practical. Confirm it fails before the fix and passes after.
- Fix the root cause, not the symptom.
- After the fix, keep the test, merge it into existing tests, or delete it, based on its value.

## Done

- Run the project's checks and verify the affected behavior. Report what changed, how you verified it, and what you couldn't verify.
