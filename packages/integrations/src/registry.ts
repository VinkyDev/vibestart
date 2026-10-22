import { defineRegistry } from "@vibestart/core";

import { betterAuth } from "#/better-auth.ts";
import { bun } from "#/bun.ts";
import { catalog } from "#/catalog.ts";
import { docker } from "#/docker.ts";
import { drizzle } from "#/drizzle.ts";
import { electron } from "#/electron.ts";
import { expo } from "#/expo.ts";
import { hono } from "#/hono.ts";
import { knip } from "#/knip.ts";
import { mongodb } from "#/mongodb.ts";
import { mongoose } from "#/mongoose.ts";
import { mysql } from "#/mysql.ts";
import { next } from "#/next.ts";
import { node } from "#/node.ts";
import { openapi } from "#/openapi.ts";
import { orpc } from "#/orpc.ts";
import { postgres } from "#/postgres.ts";
import { prisma } from "#/prisma.ts";
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
import { voidDeployment } from "#/void.ts";
import { workers } from "#/workers.ts";

export const registry = defineRegistry({
  addons: [knip, ultracite],
  capabilities: {
    "frontend-framework": "a frontend framework",
    "fullstack-framework": "a full-stack framework",
    "hono-server": "a Hono server",
    "http-server": "an HTTP server",
    "node-runtime": "a Node.js-compatible runtime",
    "workers-runtime": "the Cloudflare Workers runtime",
    "cloudflare-deployment": "deployment to Cloudflare through Void",
    react: "React",
    router: "a router",
    "single-page-app": "a single-page app",
    rpc: "a typed RPC layer",
    "database-server": "a database server (PostgreSQL or MySQL)",
    "document-database": "a document database",
    "document-orm": "a document ODM",
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
    expo,
    tanstackRouter,
    hono,
    self,
    orpc,
    openapi,
    postgres,
    mysql,
    sqlite,
    mongodb,
    drizzle,
    prisma,
    mongoose,
    betterAuth,
    shadcn,
    electron,
    node,
    bun,
    workers,
    docker,
    voidDeployment,
    playwrightTests,
    e2eTests,
  ],
  kindGroups: [["framework", "backend", "mobile"]],
  kinds: [
    { id: "toolchain", name: "Toolchain", optional: false },
    { id: "frontend", name: "Frontend", optional: true },
    { id: "framework", name: "Framework", optional: true },
    { id: "router", name: "Router", optional: true },
    { id: "backend", name: "Backend", optional: true },
    { id: "api", name: "API", optional: true },
    { id: "database", name: "Database", optional: true, default: "sqlite" },
    { id: "orm", name: "ORM", optional: true, default: "drizzle" },
    { id: "auth", name: "Auth", optional: true },
    { id: "ui", name: "UI", optional: true },
    { id: "desktop", name: "Desktop", optional: true, default: null },
    { id: "mobile", name: "Mobile", optional: true, default: null },
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
