import { contribute, defineIntegration, packageJson } from "@vibestart/core";

import { templateFiles } from "#/templates.ts";
import { readmeLayers } from "#/vite-plus/slots.ts";

export const solid = defineIntegration({
  id: "solid",
  kind: "frontend",
  name: "Solid 2",
  description: "Fine-grained reactive components with Solid 2",
  homepage: "https://www.solidjs.com",
  provides: ["solid"],
  requires: ["frontend-framework", "ui-components"],
  contribute: (ctx) => [
    ...templateFiles(ctx, "solid/common"),
    contribute(packageJson, {
      path: "apps/web",
      dependencies: ["solid-js", "@solidjs/web"],
    }),
    contribute(readmeLayers, {
      layer: "Frontend",
      choice: "Solid 2 with the Solid JSX compiler",
    }),
  ],
});

export const solidRouter = defineIntegration({
  id: "solid-router",
  kind: "router",
  name: "Solid Router",
  description: "Typed client-side routing for Solid 2",
  homepage: "https://docs.solidjs.com/routing/solid-router/setup/",
  provides: ["router"],
  requires: ["solid"],
  contribute: (ctx) => [
    ...templateFiles(ctx, "solid-router/common"),
    contribute(packageJson, {
      path: "apps/web",
      dependencies: ["@solidjs/router"],
    }),
  ],
});
