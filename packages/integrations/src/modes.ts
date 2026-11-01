import { contribute, defineIntegration, packageJson } from "@vibestart/core";

import { effectConventions } from "#/effect/conventions.ts";
import { knipEntries } from "#/knip.ts";
import { ultraciteOverrides } from "#/ultracite.ts";
import { agentsConventions, agentsNotes } from "#/vite-plus/slots.ts";

export const standard = defineIntegration({
  id: "standard",
  kind: "mode",
  name: "Standard",
  description:
    "Familiar TypeScript with the widest choice of frameworks, databases, and targets",
  homepage: "https://vibestart.net",
  choices: {
    backend: ["hono", "self", null],
    api: ["orpc", "openapi", null],
  },
  contribute: () => [],
});

export const effect = defineIntegration({
  id: "effect",
  kind: "mode",
  name: "Effect",
  description:
    "A stricter, heavier model for complex service flows, with a focused set of stacks",
  homepage: "https://effect.website",
  choices: {
    toolchain: ["vite-plus"],
    frontend: ["react"],
    framework: ["spa"],
    router: ["tanstack-router"],
    backend: ["effect-http"],
    api: ["effect-rpc"],
    database: ["postgres", "sqlite", null],
    orm: ["drizzle", null],
    auth: ["better-auth", null],
    ui: ["shadcn"],
    desktop: [null],
    mobile: [null],
    runtime: ["node"],
    deployment: ["docker", null],
    testing: ["playwright", "e2e"],
  },
  contribute: (ctx) => [
    contribute(packageJson, {
      devDependencies: ["effect"],
      path: ".",
    }),
    // `AGENTS.md` directs agents to `node_modules/effect/AGENTS.md` and `node_modules/effect/src` at the root.
    contribute(knipEntries, {
      ignoreDependencies: ["effect"],
      workspace: ".",
    }),
    ...effectConventions(ctx).map((convention) =>
      contribute(agentsConventions, convention)
    ),
    contribute(
      agentsNotes,
      `\`vp run dev\` serves the web app on :5173 and the API on :3000. Request flow: Effect Atom → POST /rpc (NDJSON) → schema validation${ctx.has("better-auth") ? " → AuthMiddleware" : ""} → Effect services${ctx.stack.database === undefined ? "" : ` → Drizzle on ${ctx.has("sqlite") ? "@effect/sql-sqlite-node" : "@effect/sql-pg"}`}. Vite proxies /rpc and /api in development; the Effect server serves the SPA in production. Set ${ctx.has("better-auth") ? "BETTER_AUTH_URL" : "APP_URL"} to the browser-facing origin. The RPC HTTP boundary rejects a supplied Origin that differs from it before decoding messages. RPC envelope headers never establish origin trust; non-browser clients may omit Origin.${ctx.stack.database !== undefined && !ctx.has("better-auth") ? " Todos are public and shared by all visitors; add authentication before storing private data." : ""}`
    ),
    contribute(
      ultraciteOverrides,
      `{
      // Effect generators are anonymous; schemas, services, and tagged errors use classes and value+type pairs.
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        "eslint/func-names": ["error", "always", { generators: "never" }],
        "eslint/max-classes-per-file": "off",
        "eslint/no-redeclare": "off",
        "unicorn/throw-new-error": "off",
      },
    }`
    ),
  ],
});
