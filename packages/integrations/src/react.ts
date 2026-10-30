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

// RPC integrations own their status component; REST calls `/api/health` directly.
const healthStatus = (ctx: Context) =>
  hasBackend(ctx) && !ctx.has("orpc") && !ctx.has("effect")
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
        ...(ctx.has("effect")
          ? []
          : ["@tanstack/react-query", "@tanstack/react-query-devtools"]),
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
  description: "React 19 components and hooks",
  homepage: "https://react.dev",
  provides: ["react"],
  requires: ["frontend-framework", "ui-components"],
});
