import { major } from "semver";

import {
  contribute,
  defineIntegration,
  file,
  packageJson,
  renderFile,
} from "@vibestart/core";
import type { Context } from "@vibestart/core";

import { hasWebApp, pageRendering } from "#/app-shape.ts";
import { toolchainVersions } from "#/catalog.ts";
import { databaseCheck, databaseFlow, databaseName } from "#/database.ts";
import { envFiles } from "#/env-files.ts";
import { apiVariant, authVariant } from "#/example.ts";
import {
  renderIndex,
  runtimeDependencies,
  serverImage,
  serverScripts,
} from "#/hono/server.ts";
import { rpcPath } from "#/request-paths.ts";
import { serverPort } from "#/server-address.ts";
import {
  environmentConvention,
  renderEnvModule,
  serverEnv,
} from "#/server-environment.ts";
import { stackHeadline } from "#/stack-headline.ts";
import { replaceOnce, templateContent, templateFiles } from "#/templates.ts";
import { ultraciteOverrides } from "#/ultracite.ts";
import {
  agentsConventions,
  agentsMap,
  agentsNotes,
  readmeLayers,
  readmeOpen,
  readmeTagline,
  unitTestSources,
} from "#/vite-plus/slots.ts";
import {
  workerNodeEnv,
  workerServices,
  workerTsconfig,
} from "#/workers/app.ts";
import { workerViteConfig } from "#/workers/vite-config.ts";

// Without an API, the server answers `/api/health` itself.
const healthHandler = (ctx: Context) => {
  if (ctx.stack.database === undefined) {
    return ['const health = (c: Context) => c.json({ status: "ok" });'];
  }

  const check = databaseCheck(ctx, "db");

  return [
    `const health = ${check.async ? "async " : ""}(c: Context) => {`,
    `  ${check.statement}`,
    "",
    '  return c.json({ status: "ok" });',
    "};",
  ];
};

const apiRoutes = (ctx: Context) => {
  if (ctx.has("orpc")) {
    return [`  .all("${rpcPath(ctx)}/*", rpc)`, '  .all("/api/*", openApi)'];
  }

  const services = ctx.has("better-auth") ? "{ auth, db }" : "{ db }";
  const created = ctx.stack.database === undefined ? "" : services;

  return ctx.has("openapi")
    ? [`  .route("/api", createApi(${created}))`]
    : ['  .get("/api/health", health)'];
};

const routes = (ctx: Context) => {
  const auth = ctx.has("better-auth")
    ? ['  .on(["GET", "POST"], "/api/auth/*", authHandler)']
    : [];

  const lines = [
    "export const app = new Hono()",
    "  .use(logger())",
    "  .use(secureHeaders())",
    ...auth,
    ...apiRoutes(ctx),
  ];

  return [...lines.slice(0, -1), `${lines.at(-1)};`];
};

const contextImport = (ctx: Context) => {
  if (ctx.stack.database === undefined) {
    return [];
  }

  const names = [
    ...(ctx.has("better-auth") ? ["auth"] : []),
    ...(ctx.has("orpc") ? [] : ["db"]),
  ].join(", ");

  return names === "" ? [] : [`import { ${names} } from "#src/context.ts";`];
};

const renderWorkerApp = (ctx: Context) => {
  const database = ctx.stack.database !== undefined;
  const auth = ctx.has("better-auth");
  const api = ctx.stack.api !== undefined;
  const rpc = ctx.has("orpc");
  const names = auth ? "auth, db" : "db";

  const handlers = [
    ...(rpc && database
      ? [`const { rpc, openApi } = createRpc({ ${names} });`, ""]
      : []),
    ...(auth
      ? [
          "const authHandler = async (c: Context) => await auth.handler(c.req.raw);",
          "",
        ]
      : []),
    ...(!api && database ? [...healthHandler(ctx), ""] : []),
  ];

  const factory = `export const createApp = (${database ? `{ ${names} }: Services` : ""}) =>`;

  return [
    ...(ctx.has("openapi")
      ? [`import { createApi } from "${ctx.scope}/api";`]
      : []),
    ...(!api && database ? databaseCheck(ctx, "db").imports : []),
    'import { Hono } from "hono";',
    ...(auth || !api ? ['import type { Context } from "hono";'] : []),
    'import { logger } from "hono/logger";',
    'import { secureHeaders } from "hono/secure-headers";',
    "",
    ...(database ? ['import type { Services } from "#src/context.ts";'] : []),
    ...(rpc
      ? [
          `import { ${database ? "createRpc" : "openApi, rpc"} } from "#src/orpc.ts";`,
        ]
      : []),
    "",
    ...(!api && !database ? [...healthHandler(ctx), ""] : []),
    ...(handlers.length === 0
      ? routes(ctx).map((line) => line.replace("export const app =", factory))
      : [
          `${factory} {`,
          ...handlers,
          ...routes(ctx).map((line) =>
            line.replace("export const app =", "return")
          ),
          "};",
        ]),
    "",
  ].join("\n");
};

const renderApp = (ctx: Context) => {
  if (ctx.has("workers")) {
    return renderWorkerApp(ctx);
  }

  const auth = ctx.has("better-auth");
  const api = ctx.stack.api !== undefined;

  return [
    ...(ctx.has("openapi")
      ? [`import { createApi } from "${ctx.scope}/api";`]
      : []),
    ...(!api && ctx.stack.database !== undefined
      ? databaseCheck(ctx, "db").imports
      : []),
    'import { Hono } from "hono";',
    ...(auth || !api ? ['import type { Context } from "hono";'] : []),
    'import { logger } from "hono/logger";',
    'import { secureHeaders } from "hono/secure-headers";',
    "",
    ...contextImport(ctx),
    ...(ctx.has("orpc")
      ? ['import { openApi, rpc } from "#src/orpc.ts";']
      : []),
    "",
    ...(auth
      ? [
          "const authHandler = async (c: Context) => await auth.handler(c.req.raw);",
          "",
        ]
      : []),
    ...(api ? [] : [...healthHandler(ctx), ""]),
    ...routes(ctx),
    "",
  ].join("\n");
};

const renderTsconfig = (ctx: Context) => {
  const include = ["src", "vite.config.ts"];

  return `{
  "extends": "${ctx.scope}/config/typescript/node.json",
${ctx.has("bun") ? '  "compilerOptions": { "types": ["node", "bun"] },\n' : ""}  "include": [${include.map((path) => `"${path}"`).join(", ")}]
}
`;
};

const services = (ctx: Context) => {
  if (ctx.has("workers")) {
    return ctx.stack.database === undefined
      ? "the Worker fetch handler and Hono routes"
      : `request-scoped ${ctx.has("better-auth") ? "`db` and `auth`" : "`db`"} passed to \`createApp\``;
  }

  if (ctx.stack.database === undefined) {
    return "`env`";
  }

  return ctx.has("better-auth")
    ? "`env`, the shared `db` and `auth` instances, Better Auth at `/api/auth`"
    : "`env`, the shared `db`";
};

const apiOwns = (ctx: Context) => {
  if (ctx.has("orpc")) {
    return [`oRPC at \`${rpcPath(ctx)}\``, "OpenAPI and docs at `/api`"];
  }

  return ctx.has("openapi")
    ? ["mounts `packages/api` at `/api`"]
    : ["the routes, including `/api/health`"];
};

const owns = (ctx: Context) => {
  const parts = [
    services(ctx),
    ...apiOwns(ctx),
    ...(pageRendering(ctx.stack) === "client"
      ? ["the built SPA in production"]
      : []),
  ];

  const runtime = ctx.has("bun") ? "Bun" : "Node";

  return `Hono on ${ctx.has("workers") ? "Workers" : runtime}: ${parts.join(", ")}`;
};

const health = (ctx: Context) =>
  ctx.stack.database === undefined
    ? "`GET /api/health` answers when the server is up"
    : `\`GET /api/health\` checks ${databaseName(ctx)}`;

const openapiStandalone = (ctx: Context) => [
  contribute(
    agentsNotes,
    `\`vp run dev\` serves the API on :3000. Request flow: client → \`/api/*\` → \`packages/api\` route${databaseFlow(ctx)}. The OpenAPI document is at \`/api/openapi.json\`, with reference docs at \`/api\`.`
  ),
  contribute(
    readmeOpen,
    "The API listens on http://localhost:3000. API docs are at http://localhost:3000/api."
  ),
];

// Without a web app the server is the whole project, so it carries the notes a web app would.
const standalone = (ctx: Context) => {
  if (ctx.has("openapi")) {
    return openapiStandalone(ctx);
  }

  return ctx.has("orpc")
    ? [
        contribute(
          agentsNotes,
          `\`vp run dev\` serves the API on :3000. Request flow: client → \`POST ${rpcPath(ctx)}/*\` → \`packages/api\` procedure${databaseFlow(ctx)}. \`/api/*\` serves the same procedures as OpenAPI, with reference docs at \`/api\`.`
        ),
        contribute(
          readmeOpen,
          "The API listens on http://localhost:3000. API docs are at http://localhost:3000/api."
        ),
      ]
    : [
        contribute(
          agentsNotes,
          `\`vp run dev\` serves the server on :3000. Routes are registered on \`app\` in \`src/app.ts\`; ${health(ctx)}.`
        ),
        contribute(
          readmeOpen,
          "The server listens on http://localhost:3000, with its health at http://localhost:3000/api/health."
        ),
      ];
};

const renderViteConfig = (ctx: Context) => {
  if (ctx.has("workers")) {
    return workerViteConfig(ctx);
  }

  const database = ctx.stack.database !== undefined;

  return [
    'import { defineConfig } from "vite-plus";',
    "",
    "export default defineConfig({",
    "  pack: {",
    ...(database && !ctx.has("mongodb")
      ? [
          '    copy: [{ from: "../../packages/db/src/migrations", to: "dist" }],',
        ]
      : []),
    ctx.has("bun")
      ? "    deps: { alwaysBundle: [/^(?!bun(?:$|:))/u], neverBundle: [/^bun(?:$|:)/u] },"
      : "    deps: { alwaysBundle: [/./u] },",
    database
      ? '    entry: ["src/index.ts", "src/migrate.ts"],'
      : '    entry: ["src/index.ts"],',
    "  },",
    "});",
    "",
  ].join("\n");
};

const middlewareOverride = (ctx: Context) => {
  const files = [
    "apps/server/src/**",
    ...(ctx.has("openapi") ? ["packages/api/src/**"] : []),
  ];

  return `{
  // Hono middleware awaits \`next()\`, which is not a Node.js error-first callback.
  files: [${files.map((glob) => `"${glob}"`).join(", ")}],
  rules: { "node/callback-return": "off" },
}`;
};

const contextFiles = (ctx: Context) => {
  if (ctx.stack.database === undefined) {
    return [];
  }

  return ctx.has("workers")
    ? [file("apps/server/src/context.ts", workerServices(ctx))]
    : templateFiles(ctx, `hono/${authVariant(ctx.stack)}`);
};

const environmentFiles = (ctx: Context) => {
  if (ctx.has("workers")) {
    return ctx.stack.database === undefined
      ? []
      : [renderFile("apps/server/src/node-env.ts", workerNodeEnv)];
  }

  return [
    renderFile("apps/server/src/env.ts", (read) =>
      renderEnvModule([...read(serverEnv), serverPort(ctx.stack)], false)
    ),
  ];
};

const backendChoice = (ctx: Context) => {
  if (ctx.has("workers")) {
    return "Hono on Cloudflare Workers";
  }

  return ctx.has("bun")
    ? "Hono on Bun"
    : `Hono on Node.js ${major(toolchainVersions.node)}`;
};

const serverPackage = (ctx: Context) =>
  contribute(packageJson, {
    dependencies: [
      ...runtimeDependencies(ctx),
      ...(ctx.has("workers") && ctx.stack.database === undefined
        ? []
        : ["@t3-oss/env-core"]),
      "hono",
      ...(ctx.has("workers") && ctx.stack.database === undefined
        ? []
        : ["zod"]),
    ],
    devDependencies: [
      `${ctx.scope}/config`,
      "@types/node",
      ...(ctx.has("bun") ? ["@types/bun"] : []),
      ...(ctx.has("workers") ? [`${ctx.scope}/web`] : []),
      "typescript",
      "vite-plus",
    ],
    imports: { "#src/*": "./src/*" },
    path: "apps/server",
    scripts: serverScripts(ctx),
  });

const orpcPath = "apps/server/src/orpc.ts";

// A Worker builds services per request, so its database-backed oRPC templates receive them; the stateless one only moves its RPC prefix.
const orpcFiles = (ctx: Context) => {
  const variant = apiVariant(ctx.stack);

  if (!ctx.has("workers")) {
    return templateFiles(ctx, `hono/orpc-${variant}`);
  }

  if (variant !== "stateless") {
    return templateFiles(ctx, `hono/workers-orpc-${variant}`);
  }

  const set = "hono/orpc-stateless";

  return [
    ...templateFiles(ctx, set, { except: [orpcPath] }),
    file(
      orpcPath,
      replaceOnce(
        templateContent(ctx, set, orpcPath),
        '"/rpc"',
        `"${rpcPath(ctx)}"`,
        `${set}/${orpcPath}`
      )
    ),
  ];
};

export const hono = defineIntegration({
  contribute: (ctx) => [
    ...contextFiles(ctx),
    ...(ctx.has("orpc") ? orpcFiles(ctx) : []),
    file("apps/server/vite.config.ts", renderViteConfig(ctx)),
    ...(ctx.has("workers")
      ? []
      : [file("apps/server/src/index.ts", renderIndex(ctx))]),
    file("apps/server/src/app.ts", renderApp(ctx)),
    ...(ctx.has("workers")
      ? workerTsconfig(ctx)
      : [file("apps/server/tsconfig.json", renderTsconfig(ctx))]),
    ...environmentFiles(ctx),
    contribute(envFiles, {
      lines: (read) => [
        ...read(serverEnv),
        ...(ctx.has("workers") ? [] : [serverPort(ctx.stack)]),
      ],
      path: "apps/server/.env",
    }),
    serverPackage(ctx),
    ...(ctx.stack.database !== undefined && ctx.stack.api === undefined
      ? [
          contribute(packageJson, {
            path: "apps/server",
            dependencies: databaseCheck(ctx, "db").dependencies,
          }),
        ]
      : []),
    contribute(unitTestSources, "apps/server/src"),
    contribute(ultraciteOverrides, middlewareOverride(ctx)),
    ...serverImage(ctx),
    contribute(agentsMap, { owns: owns(ctx), path: "apps/server" }),
    contribute(
      agentsConventions,
      environmentConvention(
        ctx,
        hasWebApp(ctx.stack)
          ? "The web app is shipped to the browser, so it holds no secret."
          : `${ctx.has("bun") ? "Bun" : "Node"} loads \`.env\` in development; production gets the variables from the platform.`
      )
    ),
    contribute(readmeTagline, "Hono"),
    contribute(stackHeadline, { name: "Hono", role: "Backend" }),
    contribute(readmeLayers, {
      choice: backendChoice(ctx),
      layer: "Backend",
    }),
    ...(hasWebApp(ctx.stack) ? [] : standalone(ctx)),
  ],
  id: "hono",
  kind: "backend",
  name: "Hono",
  description: "Standalone API server built on Hono",
  homepage: "https://hono.dev",
  provides: ["hono-server", "http-server"],
  requires: [
    ["node-runtime", "workers-runtime"],
    ["node-runtime", "single-page-app"],
  ],
});
