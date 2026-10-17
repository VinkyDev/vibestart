import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
} from "@vibestart/core";

import {
  apiTemplates,
  databaseCheck,
  databaseName,
  hasWebApp,
  ormDependencies,
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

const healthRoute = (description: string) => [
  "const health = createRoute({",
  '  method: "get",',
  '  path: "/",',
  "  responses: {",
  "    200: {",
  '      content: { "application/json": { schema: z.object({ status: z.literal("ok") }) } },',
  `      description: "${description}",`,
  "    },",
  "  },",
  "});",
  "",
];

const renderHealth = (ctx: Context) => {
  if (ctx.stack.database === undefined) {
    return [
      'import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";',
      "",
      ...healthRoute("The server answers"),
      "export const healthRoutes = () =>",
      '  new OpenAPIHono().openapi(health, (c) => c.json({ status: "ok" as const }, 200));',
      "",
    ].join("\n");
  }

  const check = databaseCheck(ctx, "c.var.services.db");

  return [
    'import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";',
    ...check.imports,
    "",
    'import type { ApiEnv } from "#src/services.ts";',
    "",
    ...healthRoute(`The server and ${databaseName(ctx)} answer`),
    "export const healthRoutes = () =>",
    `  new OpenAPIHono<ApiEnv>().openapi(health, ${check.async ? "async " : ""}(c) => {`,
    `    ${check.statement}`,
    "",
    '    return c.json({ status: "ok" as const }, 200);',
    "  });",
    "",
  ].join("\n");
};

const queriesPath = "apps/web/src/lib/api.ts";

// MongoDB names a todo by its ObjectId, a string the path carries as it is.
const withStringIds = (content: string) => {
  const typed = content.replaceAll("id: number", "id: string");
  const passed = typed.replaceAll("{ id: String(id) }", "{ id }");

  if (typed === content || passed === typed) {
    throw new Error(`openapi/web/${queriesPath} has no numeric todo id`);
  }

  return passed;
};

/** The typed queries over the todo routes, which the web and mobile apps share. */
export const openapiQueriesContent = (ctx: Context) => {
  const template = templateContent(ctx, "openapi/web", queriesPath);

  return ctx.has("mongodb") ? withStringIds(template) : template;
};

// Only Next.js builds a second set of queries, for its Server Components.
const queries = (ctx: Context) => {
  const content = openapiQueriesContent(ctx);

  return file(
    queriesPath,
    ctx.has("next")
      ? content
      : content.replace("export const createQueries", "const createQueries")
  );
};

// Start's client calls the API server directly during SSR; the other web apps only ever run it in the browser.
// The typed client serves the todo example; the home page's health check is a plain fetch.
const webFiles = (ctx: Context) => [
  queries(ctx),
  ...templateFiles(
    ctx,
    ctx.has("tanstack-start") ? "openapi/tanstack-start" : "openapi/browser"
  ),
  ...(ctx.has("next") ? templateFiles(ctx, "openapi/next") : []),
  contribute(packageJson, {
    dependencies: ["hono"],
    devDependencies: [`${ctx.scope}/api`],
    path: "apps/web",
  }),
];

export const openapi = defineIntegration({
  contribute: (ctx) => [
    ...templateFiles(ctx, "openapi/common", {
      except:
        ctx.stack.database === undefined ? ["packages/api/src/index.ts"] : [],
    }),
    ...apiTemplates(ctx, "openapi", "packages/api/src/routes/todos.ts"),
    file("packages/api/src/routes/health.ts", renderHealth(ctx)),
    ...(hasWebApp(ctx) && todosExample(ctx) ? webFiles(ctx) : []),
    contribute(packageJson, {
      dependencies: [
        ...(ctx.stack.database === undefined
          ? []
          : [`${ctx.scope}/db`, ...ormDependencies(ctx)]),
        "@hono/zod-openapi",
        "@scalar/hono-api-reference",
        "hono",
        "zod",
      ],
      devDependencies: [`${ctx.scope}/config`, "@types/node", "typescript"],
      exports: { ".": "./src/index.ts" },
      imports: { "#src/*": "./src/*" },
      path: "packages/api",
    }),
    contribute(packageJson, {
      dependencies: [`${ctx.scope}/api`],
      path: "apps/server",
    }),
    contribute(agentsMap, {
      owns: `OpenAPI routes (\`createApi\`), their Zod schemas, the reference docs, and the \`Api\` type ${hasWebApp(ctx) ? "the web client is" : "clients are"} typed from`,
      path: "packages/api",
    }),
    contribute(agentsConventions, {
      text: `Declare it with \`createRoute\` in a module under \`packages/api/src/routes/\`, with a Zod schema for every request part and every response status, and mount that module in \`packages/api/src/index.ts\`. ${ctx.stack.database === undefined ? "Pass what a route needs through `createApi`'s parameters" : "Read the database from `c.var.services.db`, which the server sets on every request"}, and answer an expected failure with its declared status. The OpenAPI document and ${hasWebApp(ctx) ? "the web client's" : "`hono/client`'s"} types follow with no codegen step.`,
      title: "Route",
    }),
    contribute(readmeTagline, "OpenAPI"),
    contribute(stackHeadline, "OpenAPI"),
    contribute(readmeLayers, {
      choice:
        "REST routes with `@hono/zod-openapi`, a typed `hono/client`, reference docs at `/api`",
      layer: "API",
    }),
  ],
  id: "openapi",
  kind: "api",
  name: "OpenAPI",
  description: "REST API with @hono/zod-openapi and a typed client",
  homepage: "https://hono.dev/examples/zod-openapi",
  requires: ["hono-server"],
});
