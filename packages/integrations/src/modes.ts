import { contribute, defineIntegration } from "@vibestart/core";

import { effectConventions } from "#/effect/conventions.ts";
import { ultraciteOverrides } from "#/ultracite.ts";
import { agentsConventions, agentsNotes } from "#/vite-plus/slots.ts";

export const standard = defineIntegration({
  id: "standard",
  kind: "mode",
  name: "Standard",
  description: "Compose frameworks, APIs, databases, and deployment targets",
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
    "An integrated Effect stack with typed services, RPC, and reactive state",
  homepage: "https://effect.website",
  choices: {
    toolchain: ["vite-plus"],
    frontend: ["react"],
    framework: ["spa"],
    router: ["tanstack-router"],
    backend: ["effect-http"],
    api: ["effect-rpc"],
    database: ["postgres"],
    orm: ["drizzle"],
    auth: ["better-auth"],
    ui: ["shadcn"],
    desktop: [null],
    mobile: [null],
    runtime: ["node"],
    deployment: ["docker", null],
    testing: ["e2e"],
  },
  contribute: () => [
    ...effectConventions.map((convention) =>
      contribute(agentsConventions, convention)
    ),
    contribute(
      agentsNotes,
      "`vp run dev` serves the web app on :5173 and the API on :3000. Request flow: `apps/web` atom (`src/lib/api.ts`) \u2192 `POST /rpc` (NDJSON) \u2192 `AuthMiddleware` \u2192 `packages/api` handler \u2192 Drizzle on `@effect/sql-pg` \u2192 PostgreSQL. In development Vite proxies `/rpc` and `/api` (including `/api/auth`) to the server; in production the server serves the SPA itself. The browser only ever sees one origin, so session cookies are first-party and there is no CORS configuration. Keep it that way: `BETTER_AUTH_URL` is the browser-facing origin (`http://localhost:5173` in development), and Better Auth rejects auth requests whose `Origin` differs from it."
    ),
    contribute(
      ultraciteOverrides,
      `{
      // Effect.gen and Effect.fn generators carry operation names through tracing.
      files:["**/*.ts","**/*.tsx"],rules:{"eslint/func-names":["error","always",{generators:"never"}]}
    }`
    ),
  ],
});
