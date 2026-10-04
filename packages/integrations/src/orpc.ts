import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
} from "@vibestart/core";

import {
  apiVariant,
  clientComponent,
  databaseCheck,
  hasWebApp,
  serverApp,
  stackHeadline,
  todosExample,
} from "#/app.ts";
import { templateContent, templateFiles } from "#/templates.ts";
import {
  agentsConventions,
  agentsMap,
  readmeLayers,
  readmeTagline,
} from "#/vite-plus/slots.ts";

const routerPath = "packages/api/src/index.ts";

// Without the todo example the router holds the health procedure alone.
const router = (ctx: Context) => {
  const content = templateContent(ctx, "orpc/common", routerPath);
  return file(
    routerPath,
    todosExample(ctx)
      ? content
      : content
          .split("\n")
          .filter((line) => !/todos/iu.test(line))
          .join("\n")
  );
};

const apiStatusPath = "apps/web/src/components/api-status.tsx";

const apiStatus = (ctx: Context) =>
  file(
    apiStatusPath,
    clientComponent(ctx, templateContent(ctx, "orpc/web", apiStatusPath))
  );

const renderHealth = (ctx: Context) => {
  if (ctx.stack.database === undefined) {
    return [
      'import { publicProcedure } from "#src/procedures.ts";',
      "",
      "export const health = publicProcedure",
      '  .route({ method: "GET", path: "/health" })',
      '  .handler(() => ({ status: "ok" as const }));',
      "",
    ].join("\n");
  }
  const check = databaseCheck(ctx, "context.db");
  return [
    'import { sql } from "drizzle-orm";',
    "",
    'import { publicProcedure } from "#src/procedures.ts";',
    "",
    "export const health = publicProcedure",
    '  .route({ method: "GET", path: "/health" })',
    `  .handler(${check.async ? "async " : ""}({ context }) => {`,
    `    ${check.statement}`,
    '    return { status: "ok" as const };',
    "  });",
    "",
  ].join("\n");
};

export const orpc = defineIntegration({
  contribute: (ctx) => [
    ...templateFiles(ctx, "orpc/common", { except: [routerPath] }),
    router(ctx),
    ...templateFiles(ctx, `orpc/${apiVariant(ctx)}`),
    file("packages/api/src/routers/health.ts", renderHealth(ctx)),
    ...(hasWebApp(ctx) ? [apiStatus(ctx)] : []),
    contribute(packageJson, {
      dependencies: [
        ...(ctx.stack.database === undefined
          ? []
          : [`${ctx.scope}/db`, "drizzle-orm", "zod"]),
        "@orpc/server",
      ],
      devDependencies: [`${ctx.scope}/config`, "@types/node", "typescript"],
      exports: { ".": "./src/index.ts" },
      imports: { "#src/*": "./src/*" },
      path: "packages/api",
    }),
    contribute(packageJson, {
      dependencies: [
        `${ctx.scope}/api`,
        "@orpc/openapi",
        "@orpc/server",
        "@orpc/zod",
      ],
      path: serverApp(ctx).dir,
    }),
    ...(hasWebApp(ctx)
      ? [
          contribute(packageJson, {
            dependencies: ["@orpc/client", "@orpc/tanstack-query"],
            devDependencies: [`${ctx.scope}/api`],
            path: "apps/web",
          }),
        ]
      : []),
    contribute(agentsMap, {
      owns: `oRPC routers, \`publicProcedure\`, ${ctx.has("better-auth") ? "`protectedProcedure`, " : ""}and the \`AppRouter\` type ${hasWebApp(ctx) ? "the web client is" : "clients are"} typed from`,
      path: "packages/api",
    }),
    contribute(agentsConventions, {
      text: `Add it on a router in \`packages/api/src/routers/\` and register that router in \`packages/api/src/index.ts\`. Validate input with Zod, ${ctx.stack.database === undefined ? "add what a procedure reads per request to `Context` in `packages/api/src/context.ts`" : "read the database from `context.db`"}, and throw \`ORPCError\` for an expected failure. ${hasWebApp(ctx) ? "The web client takes" : "Clients typed from `AppRouterClient` take"} the new type with no codegen step.`,
      title: "Procedure",
    }),
    contribute(readmeTagline, "oRPC"),
    contribute(stackHeadline, "oRPC"),
    contribute(readmeLayers, {
      choice: "oRPC (end-to-end types, no codegen) plus OpenAPI at `/api`",
      layer: "API",
    }),
  ],
  id: "orpc",
  kind: "api",
  name: "oRPC",
  description: "End-to-end type-safe RPC with OpenAPI docs",
  homepage: "https://orpc.dev",
  provides: ["rpc"],
  requires: ["http-server"],
});
