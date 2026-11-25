import type { Context, ReadSlot } from "@vibestart/core";
import { file, defineIntegration } from "@vibestart/core";

import { closeDatabase, renderEnvModule, serverEnv } from "#/app.ts";

export const workerApp = (ctx: Context) =>
  ctx.has("hono") ? "apps/server" : "apps/web";

/** Workers own a client per request; the stream owns it after the handler returns. */
export const workerServices = (ctx: Context) => {
  const start = ctx.has("tanstack-start");
  const auth = ctx.has("better-auth");
  const close = closeDatabase(ctx);

  return [
    ...(start
      ? ['import { getRequest } from "@tanstack/react-start/server";']
      : []),
    'import { env as bindings, waitUntil } from "cloudflare:workers";',
    "",
    `import { readEnv } from "${start ? "../../env.ts" : "../env.ts"}";`,
    "",
    ...(auth
      ? [
          `import { createAuth } from "${ctx.scope}/auth";`,
          `import type { Auth } from "${ctx.scope}/auth";`,
        ]
      : []),
    `import { createDb } from "${ctx.scope}/db";`,
    `import type { Database } from "${ctx.scope}/db";`,
    "",
    `${start ? "" : "export "}interface Services {`,
    ...(auth ? ["  auth: Auth;"] : []),
    "  db: Database;",
    "}",
    "",
    ...(start
      ? [
          "const requests = new WeakMap<Request, Services>();",
          "",
          "export const getServices = () => {",
          "  const services = requests.get(getRequest());",
          "",
          "  if (services === undefined) {",
          '    throw new Error("Services require the request middleware in src/start.ts");',
          "  }",
          "",
          "  return services;",
          "};",
          "",
        ]
      : []),
    "export const withServices = async (",
    ...(start ? ["  request: Request,"] : []),
    "  handle: (services: Services) => Promise<Response>",
    ") => {",
    "  const env = readEnv(bindings);",
    "  const db = createDb(env.DATABASE_URL ?? bindings.HYPERDRIVE.connectionString);",
    "  let streaming = false;",
    "",
    "  const dispose = async () => {",
    ...(start ? ["    requests.delete(request);"] : []),
    `    ${close}`,
    "  };",
    "",
    "  try {",
    "    const services = {",
    ...(auth
      ? [
          "      auth: createAuth({",
          "        baseURL: env.BETTER_AUTH_URL,",
          "        db,",
          "        secret: env.BETTER_AUTH_SECRET,",
          "      }),",
        ]
      : []),
    "      db,",
    "    };",
    ...(start ? ["", "    requests.set(request, services);"] : []),
    "",
    "    const response = await handle(services);",
    "",
    "    const { body } = response;",
    "",
    "    if (body === null) {",
    "      return response;",
    "    }",
    "",
    "    const { readable, writable } = new TransformStream<Uint8Array>();",
    "    const forwarded = new Response(readable, response);",
    "",
    "    const transfer = async () => {",
    "      try {",
    "        await body.pipeTo(writable);",
    "      } finally {",
    "        await dispose();",
    "      }",
    "    };",
    "",
    "    streaming = true;",
    "    waitUntil(transfer());",
    "",
    "    return forwarded;",
    "  } finally {",
    "    if (!streaming) {",
    "      await dispose();",
    "    }",
    "  }",
    "};",
    "",
  ].join("\n");
};

export const workerTsconfig = (ctx: Context) => {
  const dir = workerApp(ctx);
  const start = ctx.has("tanstack-start");
  const database = ctx.stack.database !== undefined;
  const nodeEnv = start ? "src/server/node-env.ts" : "src/node-env.ts";
  const migrate = start ? "src/server/migrate.ts" : "src/migrate.ts";

  return [
    file(
      `${dir}/tsconfig.json`,
      JSON.stringify({
        files: [],
        references: [
          { path: "./tsconfig.worker.json" },
          { path: "./tsconfig.node.json" },
        ],
      })
    ),
    file(
      `${dir}/tsconfig.worker.json`,
      JSON.stringify({
        extends: `${ctx.scope}/config/typescript/${start ? "react" : "base"}.json`,
        compilerOptions: {
          types: [
            "@cloudflare/workers-types",
            ...(start ? ["vite/client"] : []),
          ],
          jsx: start ? "react-jsx" : undefined,
        },
        include: ["src", "env.ts", "worker-env.d.ts"],
        exclude: [migrate, nodeEnv, "src/**/*.test.ts"],
      })
    ),
    file(
      `${dir}/tsconfig.node.json`,
      JSON.stringify({
        extends: `${ctx.scope}/config/typescript/${start ? "react" : "node"}.json`,
        compilerOptions: { types: ["node", ...(start ? ["vite/client"] : [])] },
        include: [
          "*.config.ts",
          "config/**/*.ts",
          "tests",
          "src/**/*.test.ts",
          ...(database ? [migrate, nodeEnv] : []),
        ],
      })
    ),
  ];
};

export const workerNodeEnv = (read: ReadSlot) =>
  renderEnvModule(
    read(serverEnv).filter(({ name }) => name === "DATABASE_URL"),
    false
  );

export const bindingNames = (ctx: Context) => [
  "DATABASE_URL",
  ...(ctx.has("better-auth") ? ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"] : []),
];

export const workerViteConfig = (ctx: Context) => {
  const start = ctx.has("tanstack-start");
  const database = ctx.stack.database !== undefined;

  return [
    'import { cloudflare } from "@cloudflare/vite-plugin";',
    ...(start
      ? [
          'import tailwindcss from "@tailwindcss/vite";',
          'import { tanstackStart } from "@tanstack/react-start/plugin/vite";',
          'import react from "@vitejs/plugin-react";',
        ]
      : []),
    `import { defineConfig${database ? ", loadEnv" : ""} } from "vite-plus";`,
    "",
    ...(database
      ? [
          "export default defineConfig(({ command, mode, isPreview }) => {",
          "  // Build artifacts must not include the local database URL or auth secret.",
          '  process.env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = String(command === "serve");',
          "",
          "  if (isPreview === true) {",
          '    const local = loadEnv(mode, import.meta.dirname, "");',
          "",
          `    for (const name of ${JSON.stringify(bindingNames(ctx))}) {`,
          "      const value = local[name];",
          "",
          "      if (value !== undefined) {",
          "        process.env[name] = value;",
          "      }",
          "    }",
          "  }",
          "",
          "  return {",
        ]
      : ["export default defineConfig({"]),
    "    plugins: [",
    '      cloudflare({ inspectorPort: false, viteEnvironment: { name: "ssr" } }),',
    ...(start
      ? [
          "      tailwindcss(),",
          "      tanstackStart(),",
          "      react({ compiler: true }),",
        ]
      : []),
    "    ],",
    ...(start ? [] : ['    publicDir: "../web/dist",']),
    "    server: { port: 3000 },",
    ...(database ? ["  };"] : []),
    "});",
    "",
  ].join("\n");
};

export const workers = defineIntegration({
  auxiliary: true,
  contribute: () => [],
  description: "Cloudflare Workers runtime, deployed with Alchemy",
  homepage: "https://developers.cloudflare.com/workers/",
  id: "workers",
  kind: "runtime",
  name: "Cloudflare Workers",
  provides: ["workers-runtime"],
  requires: ["cloudflare-deployment"],
});
