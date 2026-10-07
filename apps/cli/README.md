# vibestart-cli

**Compose. Verify. Ship.**

Compose a full-stack TypeScript stack and get a project that has been installed, checked, tested, and built for real. This package is the `vibestart` command.

```sh
npx vibestart-cli@beta my-app
```

Answer the prompts, or pass flags to skip them:

```sh
npx vibestart-cli@beta my-app --framework next --backend self --api orpc --database postgres --auth better-auth
```

Or compose visually in the [web studio](https://vibestart.net/studio) and copy the command.

## What you get

- **A current stack.** React SPA, TanStack Start, or Next.js; Hono or the framework's own server; oRPC or OpenAPI; PostgreSQL or SQLite with Drizzle; Better Auth; Electron; Docker; shadcn and Tailwind 4; [Vite+](https://viteplus.dev) and Oxlint as one toolchain; Vitest for unit and integration tests, and Playwright or TesterArmy e2e for end-to-end tests.
- **Verified combinations.** Every supported combination is generated, installed, type-checked, linted, tested, tested in a browser, and built before release. The CLI shows the result when it creates your project.
- **Agent-ready code.** Each project ships an `AGENTS.md` and `vp run ready`, so a coding agent gets fast, specific feedback.
- **Maintained after creation.** `vibestart upgrade` previews a merge of the newest template into your project before it writes anything.

A generated project is an ordinary repository with no runtime dependency on VibeStart.

## Requirements

Node.js 22.12 or newer. The CLI installs the project with pnpm (the default) or Bun 1.4.2 or newer; with pnpm absent it runs pnpm through `npx`.

## Options

| Option                                                       | Description                                                                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `--<kind> <choice>`                                          | Decide one kind (`--framework`, `--backend`, `--api`, `--database`, `--auth`, `--desktop`, `--deployment`, …). |
| `--addons <ids\|none>`                                       | Select add-ons, comma-separated.                                                                               |
| `--package-manager <pnpm\|bun>`                              | Install with pnpm (default) or Bun.                                                                            |
| `--recipe <path\|url>`                                       | Start from a `vibestart.jsonc`.                                                                                |
| `--list`                                                     | List every kind, its options, and every legal stack.                                                           |
| `--dry-run`                                                  | Resolve the stack and list the files without writing.                                                          |
| `--json`                                                     | Print one JSON object and never prompt.                                                                        |
| `--no-interactive`, `--no-git`, `--no-install`, `--no-check` | Skip prompts, `git init`, install and setup, or the final check.                                               |

Run `npx vibestart-cli@beta --help` for the full reference.

## Links

- [Documentation](https://vibestart.net/docs)
- [Source and issues](https://github.com/VinkyDev/vibestart)
- [Agent skill](https://github.com/VinkyDev/vibestart/tree/main/skills/vibestart)

MIT
