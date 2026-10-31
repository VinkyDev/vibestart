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

const routesOverride = `{
  // A loader throws \`notFound()\` and \`beforeLoad\` throws \`redirect()\`. Both are objects rather than an \`Error\`.
  files: ["apps/web/src/routes/**"],
  rules: {
    "typescript/only-throw-error": [
      "error",
      {
        allow: [
          {
            from: "package",
            name: "NotFoundError",
            package: "@tanstack/router-core",
          },
          {
            from: "package",
            name: "Redirect",
            package: "@tanstack/router-core",
          },
        ],
      },
    ],
  },
}`;

export const tanstackRouter = defineIntegration({
  contribute: (ctx) => [
    ...templateFiles(ctx, "tanstack-router/common", {
      except: ctx.has("effect") ? ["apps/web/src/lib/query-client.ts"] : [],
    }),
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
    contribute(ultraciteOverrides, routesOverride),
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
