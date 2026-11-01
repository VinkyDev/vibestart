import { contribute, defineIntegration, packageJson } from "@vibestart/core";

import { serverEnv } from "#/app.ts";
import { composeEnv } from "#/docker.ts";
import {
  contractIndex,
  databaseHealth,
  routes,
  todoFiles,
  todoWebFiles,
} from "#/effect-rpc/files.ts";
import { templateFiles } from "#/templates.ts";
import { agentsMap, readmeLayers } from "#/vite-plus/slots.ts";

export const effectRpc = defineIntegration({
  id: "effect-rpc",
  kind: "api",
  name: "Effect RPC",
  description: "Schema contracts, typed RPC, and Effect Atom clients",
  homepage: "https://effect.website",
  provides: ["rpc"],
  requires: ["effect-http-server"],
  contribute: (ctx) => [
    ...templateFiles(ctx, "effect-rpc/common"),
    ...templateFiles(ctx, "effect-rpc/web"),
    ...(ctx.stack.database === undefined
      ? templateFiles(ctx, "effect-rpc/health")
      : [
          ...templateFiles(ctx, "effect-rpc/database", {
            except: ["packages/api/src/health.ts"],
          }),
          databaseHealth(ctx),
        ]),
    ...(ctx.has("better-auth")
      ? templateFiles(ctx, "effect-rpc/auth")
      : [
          contribute(serverEnv, {
            name: "APP_URL",
            example: "http://localhost:5173",
            schema: "Config.String",
          }),
          contribute(composeEnv, {
            name: "APP_URL",
            value: `\${APP_URL:-http://localhost:3000}`,
          }),
        ]),
    ...(ctx.stack.database === undefined
      ? []
      : [...todoFiles(ctx), ...todoWebFiles(ctx)]),
    contractIndex(ctx),
    routes(ctx),
    contribute(packageJson, {
      dependencies: [
        ...(ctx.has("better-auth") ? [`${ctx.scope}/auth`] : []),
        `${ctx.scope}/contracts`,
        ...(ctx.stack.database === undefined
          ? []
          : [`${ctx.scope}/db`, "drizzle-orm"]),
        ...(ctx.has("electron") ? [`${ctx.scope}/electron`] : []),
        "effect",
      ],
      imports: {
        "#src/*": "./src/*",
      },
      exports: {
        ".": "./src/index.ts",
      },
      path: "packages/api",
    }),
    contribute(packageJson, {
      path: "packages/api",
      devDependencies: [`${ctx.scope}/config`, "@types/node", "typescript"],
    }),
    contribute(packageJson, {
      dependencies: ["effect"],
      devDependencies: [`${ctx.scope}/config`, "typescript"],
      imports: {
        "#src/*": "./src/*",
      },
      exports: {
        ".": "./src/index.ts",
      },
      path: "packages/contracts",
    }),
    contribute(packageJson, {
      path: "apps/web",
      dependencies: [
        "@effect/atom-react",
        "effect",
        `${ctx.scope}/contracts`,
        ...(ctx.stack.database === undefined ? [] : ["sonner"]),
      ],
    }),
    contribute(agentsMap, {
      path: "packages/contracts",
      owns: `Effect Schema wire contracts, RPC groups, and HTTP API${ctx.has("better-auth") ? ", plus authentication context" : ""}`,
    }),
    contribute(agentsMap, {
      path: "packages/api",
      owns: `RPC handlers and HTTP routes${ctx.stack.database === undefined ? "" : ", the Todos service"}${ctx.has("better-auth") ? ", and authentication middleware" : ""}`,
    }),
    contribute(readmeLayers, {
      layer: "API",
      choice: "Effect RPC, HttpApi and Schema; Effect Atom in the browser",
    }),
  ],
});
