<div align="center">

# VibeStart

**Compose. Verify. Ship.**

Compose a full-stack TypeScript stack and get a cutting-edge, verified project made for AI coding agents, with type safety, lint, and tests built in.

[![npm](https://img.shields.io/npm/v/vibestart-cli?label=npm&color=cb3837)](https://www.npmjs.com/package/vibestart-cli)
[![CI](https://github.com/VinkyDev/vibestart/actions/workflows/ci.yml/badge.svg)](https://github.com/VinkyDev/vibestart/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**English** · [简体中文](README.zh.md)

https://github.com/user-attachments/assets/aa58d60b-4776-460b-97ee-234aa331f436

</div>

## Quick start

### Compose it yourself

Pick each layer in the [web studio](https://vibestart.net/studio) and copy the command it builds, or answer the prompts in your terminal:

```sh
npx vibestart-cli my-app
```

### Hand it to an AI agent

Paste this command, along with what you want to build, into Claude Code, Codex, Cursor, or any coding agent:

```sh
npx skills add VinkyDev/vibestart --skill vibestart
```

The agent installs the [vibestart skill](skills/vibestart/SKILL.md), chooses the stack, and creates the project. Later, ask it to add capabilities or upgrade the templates. See the [Agent Skills guide](apps/web/content/docs/cli/skill.mdx).

## Why VibeStart

Full details: [Why vibestart](https://vibestart.net/docs/why).

With a coding agent, the hard part of an application is rarely the first day. It is the thirtieth: features pile up, the structure erodes, and each fix introduces another bug. VibeStart gives the agent, and you, a better starting point: best practices for a current, carefully chosen stack, and a codebase built so that an agent writes good code in it.

- **Good code begets good code.** An agent imitates the code around it, follows written rules, and corrects itself from errors. Every project ships a consistent codebase, an `AGENTS.md` that says where and how each change is made, and checks (types, lint, tests) that report a mistake within seconds. `vp run ready` runs them all, fastest first.
- **A current stack, kept current.** Only technologies that are the current standard or clearly becoming it: TypeScript 7, React 19 with the React Compiler, Drizzle ORM 1.0, Oxlint and Oxfmt, and [Vite+](https://viteplus.dev) as one toolchain. Open source, no vendor lock-in, one library per capability. When a better tool becomes the standard, the template moves to it and the old one is removed.
- **Composed, not copied.** Each technology is an integration with its own files, dependencies, and constraints, and the project is composed from the integrations you choose. A combination that cannot work is refused with the reason and the smallest change that fixes it.
- **Every combination is verified.** Before each release, every supported combination is generated, installed, type-checked, linted, tested, tested in a browser, and built. The result is recorded with a fingerprint in [CI artifacts](docs/architecture.md#ci), and the CLI shows it when it creates your project.
- **TypeScript across the stack.** One language from database to button, with types that travel from the schema through the API to the page and no code generation step. Zod validates data from outside.
- **Tests that earn their place.** End-to-end tests for whole workflows, integration tests for every API operation against a real database, and unit tests only for logic with real branches.
- **Maintained after creation.** `upgrade` compares the original template, your project, and the new template, and previews the result before writing anything. Template files take the update; your application code stays as you wrote it.

VibeStart does not host your application, does not migrate production data, and does not hide the code. A generated project is an ordinary repository with no runtime dependency on VibeStart.

## Supported stacks

| Layer                    | Choices                                              |
| ------------------------ | ---------------------------------------------------- |
| App                      | React SPA (TanStack Router), TanStack Start, Next.js |
| Desktop                  | Electron                                             |
| Backend                  | Hono, or the framework's own server                  |
| API                      | oRPC, OpenAPI, or none                               |
| Database                 | PostgreSQL or SQLite with Drizzle, or none           |
| Auth                     | Better Auth                                          |
| Deployment               | Docker                                               |
| UI                       | shadcn (Base UI) and Tailwind 4                      |
| Unit & integration tests | Vitest                                               |
| End-to-end tests         | Playwright or TesterArmy e2e                         |
| Toolchain                | Vite+, Oxlint, Knip, `AGENTS.md`                     |

## CLI options

Pass flags to skip the prompts:

```sh
npx vibestart-cli my-app --framework next --backend self --api orpc --database postgres --auth better-auth
```

| Option                                                       | Description                                                                                                                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--<kind> <choice>`                                          | Decide one kind (`--framework`, `--backend`, `--api`, `--database`, `--auth`, `--desktop`, `--deployment`, …). `none` is the empty choice of an optional kind. |
| `--addons <ids\|none>`                                       | Select add-ons, comma-separated. Knip and Ultracite are on by default; `none` leaves out both.                                                                 |
| `--package-manager <pnpm\|bun>`                              | Install with pnpm (default) or Bun 1.4.2 or newer.                                                                                                             |
| `--runtime <node\|bun>`                                      | Run the Hono server on Node.js (default) or Bun.                                                                                                               |
| `--recipe <path\|url>`                                       | Start from a `vibestart.jsonc`; kind flags override it.                                                                                                        |
| `--list`                                                     | List every kind, its options, and every legal stack.                                                                                                           |
| `--dry-run`                                                  | Resolve the stack and list the files without writing.                                                                                                          |
| `--json`                                                     | Print one JSON object and never prompt. Failures carry a machine-readable `code`.                                                                              |
| `--no-interactive`, `--no-git`, `--no-install`, `--no-check` | Skip prompts, `git init`, install and setup, or the final `vp check`.                                                                                          |

## Documentation

- [vibestart.net/docs](https://vibestart.net/docs): quick start, choosing a stack, the CLI reference, testing, and concepts
- [Architecture](docs/architecture.md): the model, the resolver, integrations, verification, and project maintenance
- [AGENTS.md](AGENTS.md): the rules for code in this repository and in every generated project

## Repository

| Path                    | Owns                                                                        |
| ----------------------- | --------------------------------------------------------------------------- |
| `apps/cli`              | The `vibestart` command                                                     |
| `apps/web`              | The web studio and documentation site                                       |
| `packages/core`         | Blueprint schema, resolver, and generator                                   |
| `packages/integrations` | Integrations, templates, the dependency catalog, and verification artifacts |
| `packages/config`       | Shared TypeScript presets                                                   |
| `golden/`               | Checked-in generated projects, each its own workspace                       |

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, the checks to run, and how templates are verified.

## License

[MIT](LICENSE), copyright VinkyDev and contributors. Third-party materials retain their respective licenses.
