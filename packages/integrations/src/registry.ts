import { defineRegistry } from "@vibestart/core";

import { betterAuth } from "#/better-auth.ts";
import { bun } from "#/bun.ts";
import { catalog } from "#/catalog.ts";
import { docker } from "#/docker.ts";
import { drizzle } from "#/drizzle.ts";
import { electron } from "#/electron.ts";
import { hono } from "#/hono.ts";
import { knip } from "#/knip.ts";
import { next } from "#/next.ts";
import { node } from "#/node.ts";
import { openapi } from "#/openapi.ts";
import { orpc } from "#/orpc.ts";
import { postgres } from "#/postgres.ts";
import { react } from "#/react.ts";
import { self } from "#/self.ts";
import { shadcn } from "#/shadcn.ts";
import { spa } from "#/spa.ts";
import { sqlite } from "#/sqlite.ts";
import { tanstackRouter } from "#/tanstack-router.ts";
import { tanstackStart } from "#/tanstack-start.ts";
import { e2eTests, playwrightTests } from "#/testing/index.ts";
import { ultracite } from "#/ultracite.ts";
import { vitePlus } from "#/vite-plus/index.ts";

export const registry = defineRegistry({
  addons: [knip, ultracite],
  capabilities: {
    "frontend-framework": "a frontend framework",
    "fullstack-framework": "a full-stack framework",
    "hono-server": "a Hono server",
    "http-server": "an HTTP server",
    "node-runtime": "a Node.js-compatible runtime",
    react: "React",
    router: "a router",
    "single-page-app": "a single-page app",
    rpc: "a typed RPC layer",
    "sql-database": "a SQL database",
    "sql-orm": "a SQL ORM",
    "ui-components": "a UI component library",
  },
  catalog,
  integrations: [
    vitePlus,
    react,
    spa,
    tanstackStart,
    next,
    tanstackRouter,
    hono,
    self,
    orpc,
    openapi,
    postgres,
    sqlite,
    drizzle,
    betterAuth,
    shadcn,
    electron,
    node,
    bun,
    docker,
    playwrightTests,
    e2eTests,
  ],
  kindGroups: [["framework", "backend"]],
  kinds: [
    { id: "toolchain", name: "Toolchain", optional: false },
    { id: "frontend", name: "Frontend", optional: true },
    { id: "framework", name: "Framework", optional: true },
    { id: "router", name: "Router", optional: true },
    { id: "backend", name: "Backend", optional: true },
    { id: "api", name: "API", optional: true },
    { id: "database", name: "Database", optional: true, default: "sqlite" },
    { id: "orm", name: "ORM", optional: true },
    { id: "auth", name: "Auth", optional: true },
    { id: "ui", name: "UI", optional: true },
    { id: "desktop", name: "Desktop", optional: true, default: null },
    { id: "runtime", name: "Runtime", optional: true, default: "node" },
    { id: "deployment", name: "Deployment", optional: true, default: null },
    {
      id: "testing",
      name: "End-to-end tests",
      optional: false,
      default: "playwright",
    },
  ],
});
