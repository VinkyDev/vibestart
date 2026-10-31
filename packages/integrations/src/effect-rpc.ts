import { contribute, defineIntegration, packageJson } from "@vibestart/core";

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
    contribute(packageJson, {
      dependencies: [
        `${ctx.scope}/auth`,
        `${ctx.scope}/contracts`,
        `${ctx.scope}/db`,
        "drizzle-orm",
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
      dependencies: ["@effect/atom-react", "effect", `${ctx.scope}/contracts`],
    }),
    contribute(agentsMap, {
      path: "packages/contracts",
      owns: "Effect Schema wire contracts, tagged errors, RPC groups, HTTP API, and authentication context",
    }),
    contribute(agentsMap, {
      path: "packages/api",
      owns: "Thin RPC handlers, the Todos service, authentication middleware, and HTTP routes",
    }),
    contribute(readmeLayers, {
      layer: "API",
      choice: "Effect RPC, HttpApi and Schema; Effect Atom in the browser",
    }),
  ],
});
