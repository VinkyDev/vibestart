import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  packageJson,
  setupCommand,
} from "@vibestart/core";

import { authVariant, navigation } from "#/app.ts";
import { templateFiles } from "#/templates.ts";
import { ultracitePresets, ultraciteOverrides } from "#/ultracite.ts";
import { generatedFiles, ignoredFiles } from "#/vite-plus/slots.ts";

const redirectRule = `
    // \`beforeLoad\` guards throw \`redirect()\`, which is a \`Redirect\` object rather than an \`Error\`.
    "typescript/only-throw-error": [
      "error",
      {
        allow: [
          {
            from: "package",
            package: "@tanstack/router-core",
            name: "Redirect",
          },
        ],
      },
    ],`;

const routesOverride = (ctx: Context) => `{
  files: ["apps/web/src/routes/**"],
  rules: {
    // A route module exports its \`Route\` beside the components it renders.
    "react/only-export-components": [
      "warn",
      {
        allowExportNames: ["Route"],
        customHOCs: ["createFileRoute", "createRootRouteWithContext"],
      },
    ],${ctx.has("better-auth") ? redirectRule : ""}
  },
}`;

export const tanstackRouter = defineIntegration({
  contribute: (ctx) => [
    ...templateFiles(ctx, "tanstack-router/common"),
    navigation(
      ctx,
      `tanstack-router/${authVariant(ctx)}`,
      "apps/web/src/components/header.tsx"
    ),
    // The router plugin writes the route tree during a build, from the routes the stack has.
    contribute(setupCommand, {
      run: "vp build apps/web",
      writes: ["apps/web/src/routeTree.gen.ts"],
    }),
    contribute(packageJson, {
      dependencies: [
        "@tanstack/react-router",
        "@tanstack/react-router-devtools",
      ],
      path: "apps/web",
    }),
    contribute(ultracitePresets, {
      module: "ultracite/oxlint/tanstack",
      name: "tanstack",
    }),
    contribute(ultraciteOverrides, routesOverride(ctx)),
    contribute(generatedFiles, {
      glob: "**/routeTree.gen.ts",
      label: "routeTree.gen.ts",
    }),
    contribute(ignoredFiles, ".tanstack"),
  ],
  id: "tanstack-router",
  kind: "router",
  name: "TanStack Router",
  description: "Type-safe file-based routing",
  homepage: "https://tanstack.com/router",
  provides: ["router"],
  requires: ["react"],
});
