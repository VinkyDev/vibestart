import type { Context } from "@vibestart/core";
import { contribute, packageJson } from "@vibestart/core";

import { serverEnv } from "#/app.ts";
import { composeEnv } from "#/docker.ts";
import { templateFiles } from "#/templates.ts";
import { agentsMap, readmeLayers } from "#/vite-plus/slots.ts";

export const effectAuth = (ctx: Context) => [
  ...templateFiles(ctx, "better-auth/common"),
  ...templateFiles(ctx, "better-auth/spa"),
  ...templateFiles(ctx, "better-auth/tanstack-router", {
    except: [
      "apps/web/src/components/auth-form.tsx",
      "apps/web/src/components/user-menu.tsx",
    ],
  }),
  ...templateFiles(ctx, "better-auth/effect"),
  contribute(packageJson, {
    dependencies: [
      "@better-auth/drizzle-adapter",
      `${ctx.scope}/db`,
      "better-auth",
      "drizzle-orm",
      "effect",
      "postgres",
    ],
    devDependencies: [`${ctx.scope}/config`, "@types/node", "typescript"],
    imports: {
      "#src/*": "./src/*",
    },
    exports: {
      ".": "./src/index.ts",
    },
    path: "packages/auth",
  }),
  contribute(packageJson, { path: "apps/web", dependencies: ["better-auth"] }),
  contribute(serverEnv, {
    name: "BETTER_AUTH_URL",
    example: "http://localhost:5173",
    schema: "Config.string",
  }),
  contribute(serverEnv, {
    name: "BETTER_AUTH_SECRET",
    example: "",
    schema: "Config.Redacted",
  }),
  contribute(composeEnv, {
    name: "BETTER_AUTH_URL",
    value: `\${BETTER_AUTH_URL:-http://localhost:3000}`,
  }),
  contribute(composeEnv, {
    name: "BETTER_AUTH_SECRET",
    value: `\${BETTER_AUTH_SECRET:?set BETTER_AUTH_SECRET}`,
  }),
  contribute(agentsMap, {
    path: "packages/auth",
    owns: "The Auth service: Better Auth configured from Config on its official Promise adapter",
  }),
  contribute(readmeLayers, {
    layer: "Auth",
    choice:
      "Better Auth with an Effect service boundary and PostgreSQL sessions",
  }),
];
