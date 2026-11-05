import {
  contribute,
  defineIntegration,
  packageJson,
  setupCommand,
} from "@vibestart/core";

import { authVariant, navigation } from "#/app.ts";
import { knipEntries } from "#/knip.ts";
import { templateFiles } from "#/templates.ts";
import { ultracitePresets, ultraciteOverrides } from "#/ultracite.ts";
import {
  generatedFiles,
  ignoredFiles,
  readySteps,
  rootTypeScriptFiles,
} from "#/vite-plus/slots.ts";

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
    contribute(setupCommand, {
      run: "vp run typegen",
      writes: ["apps/web/src/routeTree.gen.ts"],
    }),
    contribute(packageJson, {
      path: ".",
      scripts: { typegen: "vpx scripts/typegen.ts" },
    }),
    contribute(rootTypeScriptFiles, "scripts/typegen.ts"),
    // Knip does not discover TypeScript entry points run through vpx.
    contribute(knipEntries, { entry: ["scripts/typegen.ts"], workspace: "." }),
    contribute(readySteps, {
      command: "vp run typegen",
      description: "route types; dev generates these automatically",
      label: "typegen",
      phase: "prepare",
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
