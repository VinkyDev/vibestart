import { contribute, defineIntegration, packageJson } from "@vibestart/core";

import { serverEnv } from "#/app.ts";
import { dockerRuntime } from "#/docker.ts";
import { envFiles } from "#/env-files.ts";
import { templateFiles } from "#/templates.ts";
import { agentsMap, readmeLayers, unitTestSources } from "#/vite-plus/slots.ts";

export const effectHttp = defineIntegration({
  id: "effect-http",
  kind: "backend",
  name: "Effect HTTP",
  description: "Scoped HTTP server with Effect services and layers",
  homepage: "https://effect.website",
  provides: ["http-server", "effect-http-server"],
  requires: ["node-runtime"],
  contribute: (ctx) => [
    ...templateFiles(ctx, "effect-http/common"),
    contribute(packageJson, {
      dependencies: [
        "@effect/platform-node",
        `${ctx.scope}/api`,
        `${ctx.scope}/auth`,
        `${ctx.scope}/db`,
        "effect",
      ],
      devDependencies: [
        `${ctx.scope}/config`,
        "@types/node",
        "typescript",
        "vite-plus",
      ],
      scripts: {
        dev: "node --watch --env-file-if-exists=.env src/index.ts",
        build: "vp pack",
        start: "node --env-file-if-exists=.env dist/index.mjs",
        "db:migrate": "node --env-file-if-exists=.env src/migrate.ts",
      },
      path: "apps/server",
    }),
    contribute(envFiles, {
      path: "apps/server/.env",
      lines: (read) => [
        ...read(serverEnv),
        { name: "PORT", example: "3000", schema: "Config.Port" },
      ],
    }),
    contribute(dockerRuntime, {
      cmd: ["node", "dist/index.mjs"],
      copies: [
        ["/app/apps/server/dist", "./dist"],
        ["/app/apps/web/dist", "./dist/public"],
      ],
    }),
    contribute(unitTestSources, "apps/server/src"),
    contribute(agentsMap, {
      path: "apps/server",
      owns: "Node entry points: routes on NodeHttpServer, Layer composition, the built SPA in production, and migrate.ts",
    }),
    contribute(readmeLayers, {
      layer: "Backend",
      choice: "Effect HTTP on Node.js 26",
    }),
  ],
});
