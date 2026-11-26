import type { Context, ReadSlot } from "@vibestart/core";
import { file } from "@vibestart/core";

import { backendHost } from "#/app-shape.ts";
import { closeDatabase } from "#/database.ts";
import { renderEnvModule, serverEnv } from "#/server-environment.ts";

export const workerApp = (ctx: Context) =>
  backendHost(ctx.stack) === "standalone" ? "apps/server" : "apps/web";

/** Workers own a client per request; the stream owns it after the handler returns. */
export const workerServices = (ctx: Context) => {
  const start = ctx.has("tanstack-start");
  const auth = ctx.has("better-auth");
  const close = closeDatabase(ctx.stack);

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
