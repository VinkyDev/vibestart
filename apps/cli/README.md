# vibestart-cli

**Compose. Verify. Ship.**

Compose a full-stack TypeScript stack and get a project that has been installed, checked, tested, and built for real. This package is the `vibestart` command.

## Quick start

Answer the prompts in your terminal, or compose visually in the [web studio](https://vibestart.net/studio) and copy the command:

```sh
npx vibestart-cli my-app
```

Pass flags to skip prompts and create a complete workspace in one command:

```sh
# Recommended full-stack SPA (React + Hono + oRPC + SQLite + Better Auth)
npx vibestart-cli my-app --framework spa --backend hono --api orpc --database sqlite --auth better-auth

# SSR web app (Next.js or TanStack Start + PostgreSQL + Better Auth)
npx vibestart-cli my-app --framework next --backend self --api orpc --database postgres --auth better-auth

# Effect mode (React SPA + Effect HTTP/RPC/Atom + SQLite + Better Auth)
npx vibestart-cli my-app --mode effect --database sqlite --auth better-auth

# Cross-platform Effect stack (Web + Electron desktop + Expo mobile + Docker)
npx vibestart-cli my-app --mode effect --database sqlite --auth better-auth --desktop electron --mobile expo --deployment docker
```

Inside the generated project:

```sh
cd my-app
vp run db:migrate                # Apply SQL migrations (when using Drizzle or Prisma)
vp run dev                       # Start web, server, and desktop in development
vp run ready                     # Format + lint + typecheck + knip + unit/integration/E2E tests + build

# Day-2 maintenance
npx vibestart-cli doctor         # Check project health and template updates
npx vibestart-cli add docker     # Add Docker, Void, Knip, or Ultracite to an existing project
npx vibestart-cli upgrade --dry-run
```

## What you get

- **Two stack modes (`Standard` and `Effect`).** Standard mode offers React SPA, TanStack Start, or Next.js; Hono or the framework's own server; oRPC or OpenAPI; PostgreSQL, MySQL, or SQLite with Drizzle, or Prisma on PostgreSQL and MySQL; MongoDB with Mongoose; Better Auth; Electron; Expo for iOS and Android; Docker, or Void on Cloudflare Workers (preview). Effect mode (`--mode effect`) offers an end-to-end Effect v4 stack (React SPA, Effect HTTP, Effect RPC + HttpApi + Schema, Effect Atom, PostgreSQL or SQLite with Drizzle or no database, optional Better Auth, optional Electron desktop and Expo mobile, and optional Docker).
- **Verified combinations.** Before release, every file `vp run ready` reads in each supported combination, and every three of its choices together, are installed, type-checked, linted, tested, tested in a browser, and built in a combination CI runs. The CLI shows a representative pass among those that cover your project when it creates it.
- **Agent-ready code.** Each project ships an `AGENTS.md` and `vp run ready`, so a coding agent gets fast, specific feedback.
- **Maintained after creation.** `vibestart upgrade` previews a three-way merge of the newest template into your project before it writes anything.

A generated project is an ordinary repository with no runtime dependency on VibeStart.

## Requirements

Node.js 22.12 or newer. The CLI installs the project with pnpm (the default) or Bun 1.4.3 or newer; with pnpm absent it runs pnpm through `npx`.

## Options

| Option                                                       | Description                                                                                                                                   |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `--mode <standard\|effect>`                                  | Select the Standard stack (default) or the independent Effect stack.                                                                          |
| `--<kind> <choice>`                                          | Decide one kind (`--framework`, `--backend`, `--api`, `--database`, `--orm`, `--auth`, `--desktop`, `--mobile`, `--deployment`, `--testing`). |
| `--addons <ids\|none>`                                       | Select add-ons, comma-separated.                                                                                                              |
| `--package-manager <pnpm\|bun>`                              | Install with pnpm (default) or Bun.                                                                                                           |
| `--recipe <path\|url>`                                       | Start from a `vibestart.jsonc`.                                                                                                               |
| `--list`                                                     | List every kind, its options, and every legal stack (combine with `--mode effect` or `--json`).                                               |
| `--dry-run`                                                  | Resolve the stack and list the files without writing.                                                                                         |
| `--json`                                                     | Print one JSON object and never prompt.                                                                                                       |
| `--no-interactive`, `--no-git`, `--no-install`, `--no-check` | Skip prompts, `git init`, install and setup, or the final check.                                                                              |

Run `npx vibestart-cli --help` for the full reference.

## Links

- [Web Studio](https://vibestart.net/studio)
- [Documentation](https://vibestart.net/docs)
- [Effect Mode Guide](https://vibestart.net/docs/stack/effect)
- [Source and issues](https://github.com/VinkyDev/vibestart)
- [Agent skill](https://github.com/VinkyDev/vibestart/tree/main/skills/vibestart)

MIT
