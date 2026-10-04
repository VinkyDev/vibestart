import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
} from "@vibestart/core";

import { clientComponent, hasBackend } from "#/app.ts";
import { templateContent, templateFiles } from "#/templates.ts";
import { ultracitePresets } from "#/ultracite.ts";

const apiStatusPath = "apps/web/src/components/api-status.tsx";

// oRPC brings its own typed status; without it the home page asks `/api/health` directly.
const healthStatus = (ctx: Context) =>
  hasBackend(ctx) && !ctx.has("orpc")
    ? [
        file(
          apiStatusPath,
          clientComponent(
            ctx,
            templateContent(ctx, "react/health", apiStatusPath)
          )
        ),
      ]
    : [];

export const react = defineIntegration({
  contribute: (ctx) => [
    ...templateFiles(ctx, "react/common"),
    ...healthStatus(ctx),
    contribute(packageJson, {
      dependencies: [
        "@tanstack/react-query",
        "@tanstack/react-query-devtools",
        "react",
        "react-dom",
      ],
      devDependencies: ["@types/react", "@types/react-dom"],
      path: "apps/web",
    }),
    contribute(ultracitePresets, {
      module: "ultracite/oxlint/react",
      name: "react",
    }),
  ],
  id: "react",
  kind: "frontend",
  name: "React",
  description: "React 19 with TanStack Query",
  homepage: "https://react.dev",
  provides: ["react"],
  requires: ["frontend-framework", "ui-components"],
});
