import { contribute, defineIntegration, packageJson } from "@vibestart/core";

import { templateFiles } from "#/templates.ts";
import { ultraciteOverrides } from "#/ultracite.ts";
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
    contribute(
      ultraciteOverrides,
      `{
      // Effect services expose Service.use and colocate their typed errors.
      files:["packages/api/src/**"], rules:{"react-hooks/rules-of-hooks":"off","eslint/max-classes-per-file":"off","unicorn/no-array-method-this-argument":"off"}
    }`
    ),
    contribute(
      ultraciteOverrides,
      `{
      // PostgreSQL text rejects NUL, which the boundary schema excludes.
      files:["packages/contracts/src/todo.ts"], rules:{"eslint/no-control-regex":"off"}
    }`
    ),
    contribute(
      ultraciteOverrides,
      `{
      // Schema.TaggedError is a class factory; contract modules colocate schema values and types.
      files:["packages/contracts/src/**"], rules:{"eslint/max-classes-per-file":"off","eslint/no-redeclare":"off","unicorn/throw-new-error":"off"}
    }`
    ),
    contribute(
      ultraciteOverrides,
      `{
      // Atom clients are service classes; runtime.fn<void>() declares a mutation without input.
      files:["apps/web/src/lib/api.ts"], rules:{"eslint/max-classes-per-file":"off","typescript/no-invalid-void-type":"off"}
    }`
    ),
  ],
});
