import type { Context, ReadSlot } from "@vibestart/core";
import {
  contribute,
  file,
  defineIntegration,
  renderFile,
  packageJson,
  pnpmWorkspace,
} from "@vibestart/core";

import { closeDatabase, renderEnvModule, serverEnv } from "#/app.ts";
import { knipEntries } from "#/knip.ts";
import { ignoredFiles, readmeSections } from "#/vite-plus/slots.ts";

const workerApp = (ctx: Context) =>
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
    "  const db = createDb(env.DATABASE_URL);",
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

const authSecrets = ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"];

export const workerViteConfig = (ctx: Context) => {
  const start = ctx.has("tanstack-start");
  const database = ctx.stack.database !== undefined;
  const auth = ctx.has("better-auth");

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
          "export default defineConfig(({ command, mode }) => {",
          "  // Build artifacts must not include the local database URL or auth secret.",
          '  process.env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = String(command === "serve");',
          "",
          '  if (command === "serve") {',
          '    const local = loadEnv(mode, import.meta.dirname, "");',
          "",
          "    if (local.DATABASE_URL !== undefined) {",
          "      process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE = local.DATABASE_URL;",
          "    }",
          ...(auth
            ? [
                "",
                `    for (const name of ${JSON.stringify(authSecrets)}) {`,
                "      const value = local[name];",
                "",
                "      if (value !== undefined) {",
                "        process.env[name] = value;",
                "      }",
                "    }",
              ]
            : []),
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

const environment = (read: ReadSlot) =>
  [
    'import { z } from "zod";',
    "",
    "const schema = z.object({",
    ...read(serverEnv).map(({ name, schema }) => `  ${name}: ${schema},`),
    "});",
    "",
    "export const readEnv = ({ HYPERDRIVE, ...bindings }: Cloudflare.Env) =>",
    "  schema.parse({ ...bindings, DATABASE_URL: HYPERDRIVE.connectionString });",
    "",
  ].join("\n");

const compatibilityDate = "2026-10-01";
const compatibilityFlags = ["nodejs_compat", "enable_request_signal"];

export const workers = defineIntegration({
  auxiliary: true,
  id: "workers",
  kind: "runtime",
  name: "Cloudflare Workers",
  description: "Run the web app on Cloudflare Workers",
  homepage: "https://developers.cloudflare.com/workers/",
  provides: ["workers-runtime"],
  requires: ["frontend-framework"],
  choices: { deployment: [null] },
  contribute: (ctx) => {
    const dir = workerApp(ctx);
    const database = ctx.stack.database !== undefined;
    const hono = ctx.has("hono");
    const worker = hono || ctx.has("tanstack-start");

    return [
      ...(worker
        ? [
            file(
              `${dir}/wrangler.jsonc`,
              JSON.stringify({
                name: ctx.name,
                main: hono
                  ? "./src/worker.ts"
                  : "@tanstack/react-start/server-entry",
                assets: hono
                  ? {
                      not_found_handling: "single-page-application",
                      run_worker_first: ["/api", "/api/*"],
                    }
                  : undefined,
                hyperdrive: database
                  ? [{ binding: "HYPERDRIVE", id: "your-hyperdrive-id" }]
                  : undefined,
                secrets: ctx.has("better-auth")
                  ? { required: authSecrets }
                  : undefined,
                compatibility_date: compatibilityDate,
                compatibility_flags: compatibilityFlags,
              })
            ),
            contribute(packageJson, {
              path: dir,
              devDependencies: [
                "@cloudflare/vite-plugin",
                "@cloudflare/workers-types",
              ],
            }),
          ]
        : []),
      ...(database
        ? [
            renderFile(`${dir}/env.ts`, environment),
            contribute(
              readmeSections,
              () =>
                `## Workers database\n\nLocal development and migrations use \`DATABASE_URL\`. Before deploying, replace \`your-hyperdrive-id\` in \`${dir}/wrangler.jsonc\` with the ID of a cache-disabled [Hyperdrive configuration](https://developers.cloudflare.com/hyperdrive/) for the same database. The deployed Worker connects through the \`HYPERDRIVE\` binding. Run migrations against that database before switching traffic.`
            ),
            file(
              `${dir}/worker-env.d.ts`,
              "declare namespace Cloudflare {\n  interface Env {\n    HYPERDRIVE: Hyperdrive;\n  }\n}\n"
            ),
          ]
        : []),
      ...(hono
        ? [
            file(
              `${dir}/src/worker.ts`,
              [
                'import { createApp } from "#src/app.ts";',
                ...(database
                  ? ['import { withServices } from "#src/context.ts";']
                  : []),
                "",
                "export default {",
                "  async fetch(request: Request) {",
                database
                  ? "    return await withServices(async (services) => await createApp(services).fetch(request));"
                  : "    return await createApp().fetch(request);",
                "  },",
                "} satisfies ExportedHandler;",
                "",
              ].join("\n")
            ),
          ]
        : []),
      ...(ctx.has("tanstack-start") && database
        ? [
            file(
              "apps/web/src/start.ts",
              `import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

import { withServices } from "#src/server/context.ts";

const services = createMiddleware().server(async ({ next, request }) =>
  await withServices(request, async () => {
    const result = await next();

    return result.response;
  })
);

const csrf = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });

export const startInstance = createStart(() => ({
  requestMiddleware: [csrf, services],
}));
`
            ),
          ]
        : []),
      contribute(pnpmWorkspace, { allowBuilds: { workerd: true } }),
      contribute(ignoredFiles, ".wrangler/"),
      ...(hono
        ? [
            contribute(knipEntries, {
              workspace: dir,
              entry: ["src/worker.ts"],
              ignoreDependencies: [`${ctx.scope}/web`],
            }),
          ]
        : []),
    ];
  },
});
