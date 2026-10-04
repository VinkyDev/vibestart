# Maintaining projects

Run commands from the project root or append `--cwd /actual/project/path`. Resolve one CLI version and retain it throughout an operation. The examples use the newest published release. For preview and application, pin the package to the same exact version, for example `vibestart-cli@0.1.0-beta.1`.

## Inspect project state

```sh
npx --yes vibestart-cli doctor --offline --json
```

`doctor` is read-only. Inspect `issues`, `conflicts`, `updates`, `release`, and `status`. Without `--offline`, it also looks up npm’s `latest` channel, not the `beta` channel; `latest: null` is not proof that no release exists. A healthy result checks configuration and maintenance state, not application behavior.

Maintenance requires consistent `.vibestart/state.json` and `.vibestart/base.json`, and a recipe matching the recorded choices. Missing provenance requires an original snapshot, not a replacement baseline invented from the current project. An unfinished operation must be recovered before another write operation.

## Add capabilities

```sh
npx --yes vibestart-cli add --list --json
npx --yes vibestart-cli add knip ultracite --dry-run --json
npx --yes vibestart-cli add knip ultracite --yes --json
```

Pass capability IDs as separate positional arguments. Currently Knip, Ultracite, and Docker support addition; use the live list for the running release. Add Docker with `npx --yes vibestart-cli add docker`, following the same preview/apply workflow. Already selected capabilities are not duplicated.

`requires-upgrade` means the recorded template and current CLI release differ. Preview an upgrade first; apply it only if it fits the user's requested scope. `add` is not a framework, database, runtime, or package-manager migration command.

## Upgrade templates

```sh
npx --yes vibestart-cli upgrade --check --json
npx --yes vibestart-cli upgrade --dry-run --json
npx --yes vibestart-cli upgrade --yes --json
```

The target is the template bundled with the running CLI, not implicitly the latest npm release. `--to VERSION` selects an exact published version; replace `VERSION` with an actual version and use the same value for preview and application. Tags such as `beta` or `latest` and semver ranges are not accepted by `--to`. Fetching a different release executes its generator and requires registry access.

The CLI compares the original template, current project, and target template. It updates supported configuration and dependency files while preserving business edits. A `requires-migration` failure means starter source changes need a reviewed migration. Do not bypass it by advancing the baseline manually or regenerating over the project. This command does not promise arbitrary application migrations or update every dependency to npm's latest version.

Review the returned changes and conflicts before applying. The default write flow installs dependencies through `vp install`, runs `vp check`, runs Knip if selected, and runs the existing unit test project if present. It does not automatically initialize, migrate, or reset a database.

- `--full-check` on `add` or `upgrade` selects `vp run ready` instead of the default checks. It may need databases, listening ports, and a browser.
- `--no-install` on `add` or `upgrade` writes files and returns `needs-install`. The operation remains pending. Later, `recover --yes` installs and validates before a new operation can begin.
- These two flags cannot be combined. Only use deferred installation when it is intentional; report it as unfinished.

## Recover an operation

A read-only preview can report conflicts, but creates no candidate files. Applying a conflicting plan records candidates under `.vibestart/pending/candidates/` before modifying project files. Read the reported paths and resolve candidates using the user's existing code and the intended template change. Do not merely remove markers or choose every incoming change.

After resolving conflicts or fixing a failed installation/check:

```sh
npx --yes vibestart-cli recover --yes --json
```

Recovery resumes the recorded target and reruns required validation; it does not choose a newer release. It may install dependencies and run checks. It has no `--dry-run`, `--no-install`, or `--full-check` options.

Use a different recovery mode only when the user intends to abandon or undo the operation:

```sh
npx --yes vibestart-cli recover --abort --yes --json
npx --yes vibestart-cli recover --rollback --yes --json
```

`--abort` only abandons an operation before project files have been written. `--rollback` restores affected files, baseline, and lockfiles of an unfinished operation, and refuses to overwrite newer manual edits. Neither restores database data; rollback also does not restore `node_modules`. Use version control to undo an already completed upgrade. Do not delete pending metadata to make an operation appear complete.

## Adopt an older project

```sh
npx --yes vibestart-cli adopt --from /actual/path/original-snapshot.json --dry-run --json
npx --yes vibestart-cli adopt --from /actual/path/original-snapshot.json --yes --json
```

The input must be a genuine original template snapshot with matching project name and recipe choices. It contains its schema version, release version, name, blueprint, and original generated files. A recipe alone is insufficient. If the original snapshot is unavailable, explain the missing provenance rather than manufacturing one from business files. Adoption records a baseline; it does not install dependencies or validate the application.

## Automation contract

Maintenance JSON includes `ok`, `exitCode`, and `status`. Caught errors use an `error` string; creation instead uses an error object. Non-interactive writes require `--yes` as well as `--json`.

| Result                    | Interpretation                                                      |
| ------------------------- | ------------------------------------------------------------------- |
| `planned`                 | Preview only; nothing applied                                       |
| `no-op`                   | No change required, or no pending operation                         |
| `needs-install`           | Files written; installation and validation unfinished               |
| `conflicts`               | Resolve the plan; only an applied plan has candidate files          |
| `completed`               | Operation finished with its recorded checks                         |
| `adopted`                 | Baseline recorded without application validation                    |
| `healthy` / `attention`   | Doctor's configuration and maintenance assessment                   |
| `rolled-back` / `aborted` | An unfinished operation was undone or abandoned                     |
| `failed`                  | Inspect the error and pending state before choosing the next action |

Exit `0` includes previews and deferred installation. Exit `1` includes failures, conflicts, and available changes from `upgrade --check`; inspect the result instead of blindly retrying. Invalid maintenance arguments exit `2`; cancellation exits `130`. Do not combine `--check` with `--dry-run`, or `--rollback` with `--abort`.
