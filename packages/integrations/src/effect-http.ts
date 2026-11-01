import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
} from "@vibestart/core";

import { serverEnv } from "#/app.ts";
import { dockerRuntime } from "#/docker.ts";
import { envFiles } from "#/env-files.ts";
import { replaceOnce, templateContent, templateFiles } from "#/templates.ts";
import { agentsMap, readmeLayers, unitTestSources } from "#/vite-plus/slots.ts";

const serverFiles = (ctx: Context) => {
  const entry = "apps/server/src/index.ts";
  const pack = "apps/server/vite.config.ts";
  let code = templateContent(ctx, "effect-http/common", entry);

  const layers = [
    ...(ctx.stack.database === undefined ? [] : ["Database.layerConfig"]),
    ...(ctx.has("better-auth") ? ["Auth.layerConfig"] : []),
  ];

  code = replaceOnce(
    code,
    "  Layer.provide([Database.layerConfig, Auth.layerConfig]),\n",
    layers.length ? `  Layer.provide([${layers.join(", ")}]),\n` : "",
    entry
  );

  if (!ctx.has("better-auth")) {
    code = replaceOnce(
      code,
      `import { Auth } from "${ctx.scope}/auth";\n`,
      "",
      entry
    );
  }

  if (ctx.stack.database === undefined) {
    code = replaceOnce(
      code,
      `import { Database } from "${ctx.scope}/db";\n`,
      "",
      entry
    );
  }

  let config = templateContent(ctx, "effect-http/common", pack);

  if (ctx.stack.database === undefined) {
    config = replaceOnce(
      config,
      '    copy: [{ from: "../../packages/db/src/migrations", to: "dist" }],\n',
      "",
      pack
    );
    config = replaceOnce(
      config,
      '["src/index.ts", "src/migrate.ts"]',
      '["src/index.ts"]',
      pack
    );
  }

  return [
    ...templateFiles(ctx, "effect-http/common", { except: [entry, pack] }),
    file(entry, code),
    file(pack, config),
  ];
};

export const effectHttp = defineIntegration({
  id: "effect-http",
  kind: "backend",
  name: "Effect HTTP",
  description: "Scoped HTTP server with Effect services and layers",
  homepage: "https://effect.website",
  provides: ["http-server", "effect-http-server"],
  requires: ["node-runtime"],
  contribute: (ctx) => [
    ...serverFiles(ctx),
    contribute(packageJson, {
      dependencies: [
        "@effect/platform-node",
        `${ctx.scope}/api`,
        ...(ctx.has("better-auth") ? [`${ctx.scope}/auth`] : []),
        ...(ctx.stack.database === undefined ? [] : [`${ctx.scope}/db`]),
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
      owns: `Node entry points: routes on NodeHttpServer, Layer composition, the built SPA in production${ctx.stack.database === undefined ? "" : ", and migrate.ts"}`,
    }),
    contribute(readmeLayers, {
      layer: "Backend",
      choice: "Effect HTTP on Node.js 26",
    }),
  ],
});
