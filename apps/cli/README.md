# vibestart-cli

**Compose. Verify. Ship.**

Compose a full-stack TypeScript stack and get a project that has been installed, checked, tested, and built for real. This package is the `vibestart` command.

```sh
npx vibestart-cli
```

Answer the prompts, or compose visually in the [web studio](https://vibestart.net/studio) and copy the command.

Inside a generated project:

```sh
vp run dev                     # Start local development
vp run ready                   # Check types, lint, unused code, tests, and build
npx vibestart-cli doctor       # Inspect project state and available template updates
npx vibestart-cli upgrade      # Three-way merge template updates while keeping your code
```

## What you get

- **A current stack.** React SPA, TanStack Start, or Next.js; Hono, Effect HTTP, or the framework's own server; oRPC, Effect RPC, or OpenAPI; PostgreSQL, MySQL, or SQLite with Drizzle, or Prisma on PostgreSQL and MySQL; MongoDB with Mongoose; Better Auth; Electron; Expo for iOS and Android; Docker, or Void on Cloudflare Workers (preview); shadcn and Tailwind 4; [Vite+](https://viteplus.dev) and Oxlint as one toolchain; Vitest for unit and integration tests, and Playwright or TesterArmy e2e for end-to-end tests.
- **Two stack modes.** Standard mode is the default and offers the widest choice of stacks. Pass `--mode effect` for the independent [Effect stack](https://vibestart.net/docs/stack/effect).
- **Verified combinations.** Before release, every file `vp run ready` reads in each supported combination, and every three of its choices together, are installed, type-checked, linted, tested, tested in a browser, and built in a combination CI runs. The CLI shows a representative pass among those that cover your project when it creates it.
- **Agent-ready code.** Each project ships an `AGENTS.md` and `vp run ready`, so a coding agent gets fast, specific feedback.
- **Maintained after creation.** `vibestart upgrade` previews a merge of the newest template into your project before it writes anything.

A generated project is an ordinary repository with no runtime dependency on VibeStart.

## Requirements

Node.js 22.12 or newer. The CLI installs the project with pnpm (the default) or Bun 1.4.3 or newer; with pnpm absent it runs pnpm through `npx`.

Run `npx vibestart-cli --help` for the full CLI reference.

## Links

- [Web Studio](https://vibestart.net/studio)
- [Documentation](https://vibestart.net/docs)
- [Source and issues](https://github.com/VinkyDev/vibestart)
- [Agent skill](https://skills.sh/vinkydev/vibestart/vibestart)

MIT
