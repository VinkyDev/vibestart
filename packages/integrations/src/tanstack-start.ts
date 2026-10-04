import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
  renderFile,
} from "@vibestart/core";

import {
  apiVariant,
  authVariant,
  databaseName,
  environmentConvention,
  hasBackend,
  homePage,
  renderEnvExample,
  renderEnvModule,
  selfHealthRoute,
  serverEnv,
  serverUrl,
  stackHeadline,
  todosExample,
  webMigrates,
} from "#/app.ts";
import { dockerRuntime } from "#/docker.ts";
import { joinWords, markdownTable } from "#/format.ts";
import { templateContent, templateFiles } from "#/templates.ts";
import {
  agentsConventions,
  agentsMap,
  agentsNotes,
  ignoredFiles,
  readmeLayers,
  readmeOpen,
  readmeTagline,
  unitTestSources,
} from "#/vite-plus/slots.ts";

const viteConfigPath = "apps/web/vite.config.ts";
const packBlock = /^ {2}pack: \{\n(?: {4}.*\n)+ {2}\},\n/mu;

// `vp pack` bundles the migration entry, so only a web app that migrates keeps the `pack` block.
const viteConfig = (ctx: Context) => {
  const config = templateContent(ctx, "tanstack-start/common", viteConfigPath);
  if (!packBlock.test(config)) {
    throw new Error(
      `tanstack-start/common/${viteConfigPath} has no pack block`
    );
  }
  return file(
    viteConfigPath,
    webMigrates(ctx) ? config : config.replace(packBlock, "")
  );
};

const apiRows = (ctx: Context) =>
  ctx.has("orpc")
    ? [
        ["`/rpc/*`", "oRPC (`src/routes/rpc/$.ts`), used by the browser"],
        [
          "`/api/*`",
          "OpenAPI and the reference docs at `/api` (`src/routes/api/$.ts`)",
        ],
      ]
    : [
        [
          "`/api/health`",
          `The health check against ${databaseName(ctx)} (\`src/routes/api/health.ts\`)`,
        ],
      ];

const urlTable = (ctx: Context) =>
  markdownTable(
    ["URL", "Handled by"],
    [
      ...apiRows(ctx),
      ...(ctx.has("better-auth")
        ? [["`/api/auth/*`", "Better Auth (`src/routes/api/auth/$.ts`)"]]
        : []),
      ["everything else", "Server-rendered React routes"],
    ]
  );

const serverConvention = (ctx: Context) => {
  const modules = [
    ...(ctx.has("orpc") ? ["`src/lib/api.ts`"] : []),
    ...(ctx.has("openapi") && todosExample(ctx) ? ["`src/lib/client.ts`"] : []),
    ...(ctx.has("better-auth") ? ["`src/lib/auth.ts`"] : []),
  ];
  const example =
    modules.length === 0
      ? ""
      : `, as ${joinWords(modules)} ${modules.length === 1 ? "does" : "do"}`;
  return `Server-only code lives in \`src/server/\`. A module that also runs in the browser touches \`#src/server/*\` only inside a \`createServerFn\` handler or a \`createIsomorphicFn().server()\` branch${example}. The Start compiler strips those branches from the client bundle; any other use ships the driver and secrets to the browser.`;
};

const selfServices = (ctx: Context) => {
  if (ctx.stack.database === undefined) {
    return [];
  }
  return ctx.has("better-auth")
    ? ["`env`, the shared `db` and `auth` instances"]
    : ["`env`, the shared `db`"];
};

const selfServerOwns = (ctx: Context) =>
  `Server-only code: ${[
    ...selfServices(ctx),
    ...(ctx.has("orpc") ? ["oRPC handlers"] : []),
    ...(webMigrates(ctx) ? ["the migration entry"] : []),
  ].join(", ")}`;

const selfApi = (ctx: Context) =>
  ctx.has("orpc")
    ? [
        ...templateFiles(ctx, "tanstack-start/self-orpc"),
        ...templateFiles(ctx, `tanstack-start/self-orpc-${apiVariant(ctx)}`),
        contribute(
          agentsNotes,
          `A route \`loader\` or component calls \`api.*\` from \`src/lib/api.ts\`. During SSR that client calls the router in-process${ctx.has("better-auth") ? " with the request's cookies" : ""}; in the browser it posts to \`/rpc\`. Loader data is dehydrated into the Query cache, so the browser does not refetch it.`
        ),
      ]
    : [
        selfHealthRoute(ctx),
        contribute(packageJson, {
          dependencies: ["drizzle-orm"],
          path: "apps/web",
        }),
      ];

// The server's variables all belong to the database and the accounts on it.
const selfEnvironment = (ctx: Context) => [
  ...templateFiles(ctx, `tanstack-start/self-${authVariant(ctx)}`),
  renderFile("apps/web/src/server/env.ts", (read) =>
    renderEnvModule(read(serverEnv), false)
  ),
  renderFile("apps/web/.env.example", (read) =>
    renderEnvExample(read(serverEnv))
  ),
  contribute(packageJson, {
    dependencies: ["@t3-oss/env-core", "zod"],
    path: "apps/web",
  }),
];

const selfEnvironmentNotes = (ctx: Context) => [
  contribute(
    agentsConventions,
    environmentConvention(
      ctx,
      "Vite loads `.env` in development; production gets the variables from the platform."
    )
  ),
];

const selfContributions = (ctx: Context) => [
  ...(ctx.stack.database === undefined ? [] : selfEnvironment(ctx)),
  contribute(agentsMap, {
    owns: selfServerOwns(ctx),
    path: "apps/web/src/server",
  }),
  contribute(
    agentsNotes,
    "`vp run dev` serves the app on :3000. One process handles everything, same-origin, in development and production:"
  ),
  contribute(agentsNotes, urlTable(ctx)),
  ...selfApi(ctx),
  contribute(agentsConventions, {
    text: serverConvention(ctx),
    title: "Server",
  }),
  ...(ctx.stack.database === undefined ? [] : selfEnvironmentNotes(ctx)),
];

const honoNote = (ctx: Context) => {
  const auth = ctx.has("better-auth");
  const routes = ctx.has("orpc")
    ? "`/rpc/*` and `/api/*` server routes"
    : "`/api/*` server route";
  const forward = ctx.has("orpc") ? "forward" : "forwards";
  return [
    `\`vp run dev\` serves the app on :3000 and the API server (\`apps/server\`) on :3001. The browser talks only to the app: its ${routes}${auth ? " (including `/api/auth`)" : ""} ${forward} to the API server at \`SERVER_URL\`, so ${auth ? "session cookies are first-party and " : ""}there is no CORS configuration.`,
    ...(ctx.has("orpc")
      ? [
          `During SSR, \`api.*\` from \`src/lib/api.ts\` calls \`SERVER_URL\` directly${auth ? " with the request's cookies" : ""}; in the browser it posts to \`/rpc\`. Loader data is dehydrated into the Query cache, so the browser does not refetch it.`,
        ]
      : []),
    ...(ctx.has("openapi") && todosExample(ctx)
      ? [
          `\`api.*\` from \`src/lib/api.ts\` wraps the typed \`hono/client\` from \`src/lib/client.ts\` in TanStack Query options. During SSR that client calls \`SERVER_URL\` directly${auth ? " with the request's cookies" : ""}; in the browser it calls \`/api\`. Loader data is dehydrated into the Query cache, so the browser does not refetch it.`,
        ]
      : []),
  ].join(" ");
};

const honoContributions = (ctx: Context) => [
  ...templateFiles(ctx, "tanstack-start/hono"),
  ...(ctx.has("orpc") ? templateFiles(ctx, "tanstack-start/hono-orpc") : []),
  file("apps/web/src/server/env.ts", renderEnvModule([serverUrl], false)),
  file("apps/web/.env.example", renderEnvExample([serverUrl])),
  contribute(packageJson, {
    dependencies: ["@t3-oss/env-core", "hono", "zod"],
    path: "apps/web",
  }),
  contribute(agentsMap, {
    owns: "Server-only code: `env` with `SERVER_URL`, and the proxy to the API server",
    path: "apps/web/src/server",
  }),
  contribute(agentsNotes, honoNote(ctx)),
  contribute(agentsConventions, {
    text: serverConvention(ctx),
    title: "Server",
  }),
];

// A Start app without a backend is the server-rendered React routes alone.
const backendContributions = (ctx: Context) => {
  if (ctx.has("self")) {
    return selfContributions(ctx);
  }
  if (ctx.has("hono")) {
    return honoContributions(ctx);
  }
  return [
    contribute(
      agentsNotes,
      "`vp run dev` serves the app on :3000. It renders the React routes on the server; there is no API or database."
    ),
  ];
};

export const tanstackStart = defineIntegration({
  contribute: (ctx) => {
    const auth = ctx.has("better-auth");
    const database = webMigrates(ctx);
    return [
      ...templateFiles(ctx, "tanstack-start/common", {
        except: [viteConfigPath],
      }),
      ...templateFiles(ctx, `tanstack-start/${authVariant(ctx)}`),
      ...(todosExample(ctx) && !auth
        ? templateFiles(ctx, "tanstack-start/todos")
        : []),
      viteConfig(ctx),
      homePage(ctx, "apps/web/src/routes/index.tsx", true),
      contribute(packageJson, {
        dependencies: [
          "@tanstack/react-router-ssr-query",
          "@tanstack/react-start",
        ],
        devDependencies: [
          `${ctx.scope}/config`,
          "@tailwindcss/vite",
          "@types/node",
          "@vitejs/plugin-react",
          "nitro",
          "oxc-transform-react",
          "typescript",
          "vite",
          "vite-plus",
        ],
        imports: { "#src/*": "./src/*" },
        path: "apps/web",
        scripts: {
          dev: "vp dev",
          build: database ? "vp build && vp pack" : "vp build",
          start: "node --env-file-if-exists=.env .output/server/index.mjs",
        },
      }),
      ...(database
        ? [
            contribute(packageJson, {
              path: "apps/web",
              scripts: {
                "db:migrate":
                  "node --env-file-if-exists=.env src/server/migrate.ts",
              },
            }),
          ]
        : []),
      contribute(unitTestSources, "apps/web/src"),
      contribute(dockerRuntime, {
        cmd: ["node", ".output/server/index.mjs"],
        copies: [
          ["/app/apps/web/.output", "./.output"],
          ...(database ? [["/app/apps/web/dist", "./dist"] as const] : []),
        ],
      }),
      contribute(ignoredFiles, ".output"),
      contribute(ignoredFiles, ".nitro"),
      contribute(agentsMap, {
        owns: `TanStack Start app: SSR file routes${hasBackend(ctx) ? ", server routes, server functions" : ""}; e2e tests in \`tests/e2e/\``,
        path: "apps/web",
      }),
      ...backendContributions(ctx),
      contribute(readmeTagline, "TanStack Start"),
      contribute(stackHeadline, "TanStack Start"),
      contribute(readmeLayers, {
        choice: "TanStack Start (SSR, file routes, server routes), React 19",
        layer: "Framework",
      }),
      contribute(readmeLayers, {
        choice: "TanStack Query with SSR dehydration, Tailwind CSS 4",
        layer: "Data",
      }),
      contribute(
        readmeOpen,
        `Open http://localhost:3000${auth ? " and create an account" : ""}.${ctx.stack.api === undefined ? "" : " API docs are at http://localhost:3000/api."}`
      ),
    ];
  },
  id: "tanstack-start",
  kind: "framework",
  name: "TanStack Start",
  description: "Full-stack React with SSR, server routes, and server functions",
  homepage: "https://tanstack.com/start",
  provides: ["frontend-framework", "fullstack-framework"],
  requires: ["react", "router", "node-runtime"],
});
