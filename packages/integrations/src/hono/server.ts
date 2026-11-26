import type { Context } from "@vibestart/core";
import { contribute } from "@vibestart/core";

import { pageRendering, separateServers } from "#/app-shape.ts";
import { closeDatabase } from "#/database.ts";
import { composeServers, dockerRuntime } from "#/docker/slots.ts";

const spaFallback = [
  'const publicDir = fileURLToPath(new URL("public", import.meta.url));',
  "",
  "if (existsSync(publicDir)) {",
  "  app",
  "    .use(serveStatic({ root: publicDir }))",
  '    .get("*", serveStatic({ root: publicDir, path: "index.html" }));',
  "}",
  "",
];

const listening = `console.log(\`Server listening on http://localhost:\${port}\`);`;

const listeners = {
  node: {
    serve: "@hono/node-server",
    serveStatic: "@hono/node-server/serve-static",
    start: [
      "const server = serve({ fetch: app.fetch, port: env.PORT }, ({ port }) => {",
      `  ${listening}`,
      "});",
    ],
    stop: ["server.close();", 'await once(server, "close");'],
  },
  bun: {
    serve: "bun",
    serveStatic: "@hono/bun",
    start: [
      "const server = serve({ fetch: app.fetch, port: env.PORT });",
      "const { port } = server;",
      "",
      listening,
    ],
    stop: ["await server.stop();"],
  },
} as const;

// Workers also run migrations locally under Node, outside the Worker.
const localCommand = (ctx: Context, entry: string, watch = false) => {
  const flags = watch ? " --watch" : "";

  return ctx.has("bun")
    ? `bun${flags} ${entry}`
    : `node${flags} --env-file-if-exists=.env ${entry}`;
};

export const serverScripts = (ctx: Context) => {
  const scripts: Record<string, string> = ctx.has("workers")
    ? {
        dev: ctx.has("expo") ? "vp dev --host" : "vp dev",
        build: "vp build",
        preview: "vp preview",
      }
    : {
        dev: localCommand(ctx, "src/index.ts", true),
        build: "vp pack",
        start: localCommand(ctx, "dist/index.mjs"),
      };

  if (ctx.stack.database !== undefined) {
    scripts["db:migrate"] = localCommand(ctx, "src/migrate.ts");
  }

  return scripts;
};

export const renderIndex = (ctx: Context) => {
  const listener = ctx.has("bun") ? listeners.bun : listeners.node;
  const servesSpa = pageRendering(ctx.stack) === "client";

  return [
    'import { once } from "node:events";',
    ...(servesSpa
      ? [
          'import { existsSync } from "node:fs";',
          'import { fileURLToPath } from "node:url";',
        ]
      : []),
    "",
    `import { serve } from "${listener.serve}";`,
    ...(servesSpa
      ? [`import { serveStatic } from "${listener.serveStatic}";`]
      : []),
    "",
    'import { app } from "#src/app.ts";',
    ...(ctx.stack.database === undefined
      ? []
      : ['import { db } from "#src/context.ts";']),
    'import { env } from "#src/env.ts";',
    "",
    ...(servesSpa ? spaFallback : []),
    ...listener.start,
    "",
    'await Promise.race([once(process, "SIGINT"), once(process, "SIGTERM")]);',
    ...[
      ...listener.stop,
      ...(ctx.stack.database === undefined ? [] : [closeDatabase(ctx.stack)]),
    ].flatMap((statement) => ["", statement]),
    "",
  ].join("\n");
};

export const runtimeDependencies = (ctx: Context): string[] => {
  if (ctx.has("workers")) {
    return [];
  }

  if (ctx.has("bun")) {
    return pageRendering(ctx.stack) === "client" ? ["@hono/bun"] : [];
  }

  return ["@hono/node-server"];
};

export const serverImage = (ctx: Context) => {
  const command = [ctx.has("bun") ? "bun" : "node", "dist/index.mjs"];

  return [
    separateServers(ctx.stack)
      ? contribute(composeServers, {
          appEnv: [["SERVER_URL", "http://server:3000"]],
          command,
          name: "server",
        })
      : contribute(dockerRuntime, { cmd: command }),
    contribute(dockerRuntime, {
      copies: [
        ["/app/apps/server/dist", "./dist"],
        ...(pageRendering(ctx.stack) === "client"
          ? [["/app/apps/web/dist", "./dist/public"] as const]
          : []),
      ],
    }),
  ];
};
