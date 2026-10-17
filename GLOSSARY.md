# vibestart

The language of the generator: how a stack is chosen, rendered, verified, and maintained. User-facing terms (API, ORM, SSR) live in the docs site's glossary, `apps/web/content/docs/glossary.mdx`.

## Choosing a stack

**Kind**:
A slot of the stack that one integration fills, such as `database` or `orm`. The registry orders kinds, and that order is the order of contributions and of the fields in `vibestart.jsonc`.
_Avoid_: category, layer

**Integration**:
One choice for a kind, such as `postgres` for `database`, declared with `defineIntegration` in `packages/integrations/src/<id>.ts`.
_Avoid_: plugin, module, option

**Add-on**:
An orthogonal extension (Knip, Ultracite) chosen apart from the stack and outside the resolver. Defaults apply when `addons` is omitted.
_Avoid_: extra, optional integration

**Stack**:
A map from kind to integration id. A **legal stack** passes every resolver rule; `legalStacks` enumerates them all.
_Avoid_: preset, template, combination

**Capability**:
A string an integration `provides` or `requires`, such as `http-server`. A requirement may list alternatives. A capability has at most one provider in a stack.
_Avoid_: feature, trait

**Auxiliary**:
An integration that exists only to satisfy another's requirement, such as `node`. It is illegal in a stack that does not need it.

**Self**:
The `backend` value meaning "the framework's own server". It contributes nothing, so frameworks branch on `ctx.has("self")`.

**Violation**:
A resolver refusal with a `reason`. A **fix** is the legal stack that differs from the current one in the fewest kinds.

**Blueprint**:
The parsed `vibestart.jsonc`: `stack`, `addons`, `channel`, and an optional `packageManager`, plus `name` and `version` when the CLI wrote it. Its schema derives from the registry.
_Avoid_: config, manifest

**Recipe**:
A blueprint file or URL passed to `--recipe` to create a project without prompts.

## Rendering a project

**Contribution**:
What `contribute(ctx)` returns: a `file`, a `renderFile`, or a value added to a slot.

**Slot**:
A typed, additive channel defined by the owner of a target file, such as `packageJson` or `lintOverrides`. Contributors append; only the owner renders.
_Avoid_: hook, extension point

**Owner**:
The integration that returns a file, or `core` for `package.json`, `pnpm-workspace.yaml`, and `vibestart.jsonc`. A path has exactly one owner, and snapshots are grouped by owner.

**Template**:
A static file of a project named `my-app`, at `packages/integrations/templates/<owner>/<set>/<path>`. A **set** is a directory of templates that ships together; `common` always ships. Templates hold no dot-files.

**Setup command**:
A command run after writing, such as `vp install` or the first migration, that declares the paths it writes. Goldens and snapshots skip those paths.

**Generation**:
The virtual file tree `generate` returns: files, setup commands, and getting-started notes. Core never touches the file system.

## Verifying output

**Golden**:
A checked-in generated project in `golden/`, byte-equal to generator output. Together the goldens use every integration.

**Snapshot**:
The file snapshots in `packages/integrations/src/__snapshots__`, one per owner, holding each distinct file once under the stacks that render it.

**Fingerprint**:
The SHA-256 of an output's files, except `*.md`, plus its setup commands. A record vouches for one fingerprint.

**Task**:
One stack on one platform under one package manager: every verified stack on Linux, each golden also on Windows.

**Pass**:
A successful `vp run ready` inside a generated task. CI stores it as a **record** on the `verification` branch, keyed by platform and fingerprint.
_Avoid_: run, result

**Facet**:
One thing `ready` exercises in an output: a file, a line of the workspace file, the setup commands, or a combination of choices. A stack is **covered** when a pass vouches for each of its facets.

**Verification store**:
The orphan `verification` branch that only CI on `main` writes. `vp run stacks pull` projects it into the ignored `verification.json`.

## Maintaining a project

**Maintained file**:
Infrastructure the CLI keeps merging on `add` and `upgrade`: manifests, catalog, toolchain config, Git ignores, `AGENTS.md`, Docker files (`maintenanceFiles`). Everything else is starter source that belongs to the user.

**Manual change**:
A template change to starter source, reported in the plan's `manual` list and never written.

**Snapshot protocol**:
`vibestart snapshot`, which every release keeps: given a name and blueprint on stdin, it prints that release's generation. The CLI uses it to regenerate the merge base of another release.
_Avoid_: export, dump
