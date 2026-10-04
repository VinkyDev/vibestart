import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
  pnpmWorkspace,
  renderFile,
  setupCommand,
} from "@vibestart/core";

import {
  apiVariant,
  authVariant,
  databaseName,
  environmentConvention,
  hasBackend,
  homePage,
  navigation,
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
import { markdownTable } from "#/format.ts";
import { templateContent, templateFiles } from "#/templates.ts";
import { ultracitePresets } from "#/ultracite.ts";
import {
  agentsConventions,
  agentsMap,
  agentsNotes,
  generatedFiles,
  ignoredFiles,
  readmeLayers,
  readmeOpen,
  readmeTagline,
  readySteps,
  unitTestSources,
} from "#/vite-plus/slots.ts";

const navLinksPath = "apps/web/src/components/nav-links.tsx";
const nextConfigPath = "apps/web/next.config.ts";
const transpilePattern = /^ {2}transpilePackages: \[\n(?: {4}.*\n)+ {2}\],\n/mu;

// Next.js compiles the workspace packages the app imports at runtime: beside Hono, only the UI.
const nextConfig = (ctx: Context) => {
  const config = templateContent(ctx, "next/common", nextConfigPath);
  if (!transpilePattern.test(config)) {
    throw new Error(`next/common/${nextConfigPath} has no transpilePackages`);
  }
  const self = ctx.has("self");
  const packages = [
    ...(self && ctx.stack.api !== undefined ? ["api"] : []),
    ...(self && ctx.has("better-auth") ? ["auth"] : []),
    ...(self && ctx.stack.database !== undefined ? ["db"] : []),
    "ui",
  ].map((name) => `"${ctx.scope}/${name}"`);
  return file(
    nextConfigPath,
    config.replace(
      transpilePattern,
      `  transpilePackages: [${packages.join(", ")}],\n`
    )
  );
};

const apiRows = (ctx: Context) =>
  ctx.has("orpc")
    ? [
        [
          "`/rpc/*`",
          "oRPC (`src/app/rpc/[[...rest]]/route.ts`), used by client components",
        ],
        [
          "`/api/*`",
          "OpenAPI and the reference docs at `/api` (`src/app/api/[[...rest]]/route.ts`)",
        ],
      ]
    : [
        [
          "`/api/health`",
          `The health check against ${databaseName(ctx)} (\`src/app/api/health/route.ts\`)`,
        ],
      ];

const urlTable = (ctx: Context) =>
  markdownTable(
    ["URL", "Handled by"],
    [
      ...apiRows(ctx),
      ...(ctx.has("better-auth")
        ? [
            [
              "`/api/auth/*`",
              "Better Auth (`src/app/api/auth/[...all]/route.ts`)",
            ],
          ]
        : []),
      ["everything else", "App Router pages"],
    ]
  );

const clientConvention = (ctx: Context) => {
  const clientOnly = [
    "Hooks",
    "event handlers",
    ...(ctx.stack.api === undefined ? [] : ["`api`"]),
    ...(ctx.has("better-auth") ? ["`authClient`"] : []),
  ];
  const listed =
    clientOnly.length > 2
      ? `${clientOnly.slice(0, -1).join(", ")}, and ${clientOnly.at(-1)}`
      : clientOnly.join(" and ");
  return `A file is a Server Component until it starts with \`"use client"\`. ${listed} belong in client components. A server-only module imports \`"server-only"\`, so a client import fails the build.`;
};

const serverConvention = (ctx: Context) =>
  ctx.stack.database === undefined
    ? clientConvention(ctx)
    : `${clientConvention(ctx)} \`next build\` imports every route without runtime environment variables, so \`env\` and the database open only inside \`getServices()\`, and \`await headers()\` runs before \`getServices()\` so the page is dynamic first.`;

const selfServices = (ctx: Context) => {
  if (ctx.stack.database === undefined) {
    return [];
  }
  return ctx.has("better-auth")
    ? ["`env`, lazily created `db` and `auth`, `getSession`"]
    : ["`env`, lazily created `db`"];
};

const selfServerOwns = (ctx: Context) =>
  `Server-only code (\`import "server-only"\`): ${[
    ...selfServices(ctx),
    ...(ctx.has("orpc") ? ["oRPC handlers"] : []),
    ...(ctx.has("orpc") && todosExample(ctx) ? ["server query utilities"] : []),
    ...(webMigrates(ctx) ? ["the migration entry"] : []),
  ].join(", ")}`;

// The server query utilities prefetch the todo example's pages; nothing else renders API data on the server.
const selfOrpc = (ctx: Context) =>
  todosExample(ctx)
    ? [
        ...templateFiles(ctx, `next/self-orpc-${apiVariant(ctx)}`),
        contribute(
          agentsNotes,
          `A Server Component page prefetches with \`serverApi\` and \`getQueryClient()\` from \`src/server/query.ts\`, which call the router in-process${ctx.has("better-auth") ? " with the request's cookies" : ""}, then wraps its client component in \`<HydrationBoundary state={dehydrate(queryClient)}>\`. The client component reads the same query with \`api\` from \`src/lib/api.ts\` (\`useSuspenseQuery\`) and mutates through \`/rpc\`. Both utilities derive identical query keys, so hydrated data is not refetched.`
        ),
      ]
    : templateFiles(ctx, `next/self-orpc-${apiVariant(ctx)}`);

const selfApi = (ctx: Context) =>
  ctx.has("orpc")
    ? [...templateFiles(ctx, "next/self-orpc"), ...selfOrpc(ctx)]
    : [
        selfHealthRoute(ctx),
        contribute(packageJson, {
          dependencies: ["drizzle-orm"],
          path: "apps/web",
        }),
      ];

// The server's variables all belong to the database and the accounts on it.
const selfEnvironment = (ctx: Context) => [
  ...templateFiles(ctx, `next/self-${authVariant(ctx)}`),
  renderFile("apps/web/src/server/env.ts", (read) =>
    renderEnvModule(read(serverEnv), true)
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
      "Next.js loads `.env` in development; production gets the variables from the platform."
    )
  ),
];

const selfContributions = (ctx: Context) => [
  ...(ctx.stack.database === undefined ? [] : selfEnvironment(ctx)),
  contribute(packageJson, {
    dependencies: ["server-only"],
    path: "apps/web",
  }),
  contribute(agentsMap, {
    owns: selfServerOwns(ctx),
    path: "apps/web/src/server",
  }),
  contribute(
    agentsNotes,
    "`vp run dev` serves the app on :3000. One Next.js server handles everything, same-origin, in development and production:"
  ),
  contribute(agentsNotes, urlTable(ctx)),
  ...selfApi(ctx),
  contribute(agentsConventions, {
    text: serverConvention(ctx),
    title: "Server",
  }),
  ...(ctx.stack.database === undefined ? [] : selfEnvironmentNotes(ctx)),
];

const honoServerOwns = (ctx: Context) =>
  [
    'Server-only code (`import "server-only"`): `readEnv()` with `SERVER_URL`',
    "the proxy to the API server",
    ...(todosExample(ctx) ? ["server query utilities"] : []),
    ...(ctx.has("better-auth") ? ["`getSession`"] : []),
  ].join(", ");

const prefetchNote = (ctx: Context, mutates: string) =>
  `A Server Component page prefetches with \`serverApi\` and \`getQueryClient()\` from \`src/server/query.ts\`, which call \`SERVER_URL\` directly${ctx.has("better-auth") ? " with the request's cookies" : ""}, then wraps its client component in \`<HydrationBoundary state={dehydrate(queryClient)}>\`. The client component reads the same query with \`api\` from \`src/lib/api.ts\` (\`useSuspenseQuery\`) and mutates through ${mutates}. Both utilities derive identical query keys, so hydrated data is not refetched.`;

// The server query utilities prefetch the todo example's pages; nothing else renders API data on the server.
const honoApi = (ctx: Context) => {
  const todos = todosExample(ctx);
  if (ctx.has("orpc")) {
    return [
      ...templateFiles(ctx, "next/hono-orpc", {
        except: todos ? [] : ["apps/web/src/server/query.ts"],
      }),
      ...(todos ? [contribute(agentsNotes, prefetchNote(ctx, "`/rpc`"))] : []),
    ];
  }
  return ctx.has("openapi") && todos
    ? [contribute(agentsNotes, prefetchNote(ctx, "`/api`"))]
    : [];
};

const honoContributions = (ctx: Context) => {
  const auth = ctx.has("better-auth");
  const routes = ctx.has("orpc")
    ? "`/rpc/*` and `/api/*` route handlers"
    : "`/api/*` route handler";
  const forward = ctx.has("orpc") ? "forward" : "forwards";
  return [
    ...templateFiles(ctx, "next/hono"),
    file("apps/web/src/server/env.ts", renderEnvModule([serverUrl], true)),
    file("apps/web/.env.example", renderEnvExample([serverUrl])),
    contribute(packageJson, {
      dependencies: ["@t3-oss/env-core", "hono", "server-only", "zod"],
      path: "apps/web",
    }),
    contribute(agentsMap, {
      owns: honoServerOwns(ctx),
      path: "apps/web/src/server",
    }),
    contribute(
      agentsNotes,
      `\`vp run dev\` serves the app on :3000 and the API server (\`apps/server\`) on :3001. The browser talks only to the app: its ${routes}${auth ? " (including `/api/auth`)" : ""} ${forward} to the API server at \`SERVER_URL\`, so ${auth ? "session cookies are first-party and " : ""}there is no CORS configuration.`
    ),
    ...honoApi(ctx),
    contribute(agentsConventions, {
      text: clientConvention(ctx),
      title: "Server",
    }),
  ];
};

// A Next.js app without a backend is the App Router pages alone.
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
      "`vp run dev` serves the app on :3000. It renders the App Router pages; there is no API or database."
    ),
  ];
};

export const next = defineIntegration({
  contribute: (ctx) => {
    const auth = ctx.has("better-auth");
    const database = webMigrates(ctx);
    return [
      ...templateFiles(ctx, "next/common", {
        except: [navLinksPath, nextConfigPath],
      }),
      ...templateFiles(ctx, `next/${authVariant(ctx)}`),
      ...(ctx.has("orpc") ? templateFiles(ctx, "next/orpc") : []),
      ...(todosExample(ctx)
        ? templateFiles(ctx, `next/todos-${authVariant(ctx)}`)
        : []),
      ...(database ? templateFiles(ctx, "next/migrate") : []),
      navigation(ctx, "next/common", navLinksPath),
      nextConfig(ctx),
      homePage(ctx, "apps/web/src/app/page.tsx", false),
      contribute(packageJson, {
        dependencies: ["next", "react", "react-dom"],
        devDependencies: [
          `${ctx.scope}/config`,
          "@tailwindcss/postcss",
          "@types/node",
          "babel-plugin-react-compiler",
          "typescript",
        ],
        imports: { "#src/*": "./src/*" },
        path: "apps/web",
        scripts: {
          dev: "next dev",
          build: database ? "next build && vp pack" : "next build",
          start: "next start",
          typegen: "next typegen",
        },
      }),
      ...(database
        ? [
            contribute(packageJson, {
              devDependencies: ["vite-plus"],
              path: "apps/web",
              scripts: {
                "db:migrate":
                  "node --env-file-if-exists=.env src/server/migrate.ts",
              },
            }),
          ]
        : []),
      contribute(packageJson, {
        path: ".",
        scripts: { typegen: `vp run --filter ${ctx.scope}/web typegen` },
      }),
      // `PageProps` and typed routes exist only after typegen, so a new project type-checks after it.
      contribute(setupCommand, {
        run: "vp run typegen",
        writes: ["apps/web/.next/**", "apps/web/next-env.d.ts"],
      }),
      contribute(readySteps, {
        command: "vp run typegen",
        description: "route types for typedRoutes; dev does this automatically",
        label: "typegen",
        phase: "prepare",
      }),
      contribute(pnpmWorkspace, {
        allowBuilds: { sharp: false, "unrs-resolver": false },
      }),
      contribute(ultracitePresets, {
        module: "ultracite/oxlint/next",
        name: "next",
      }),
      contribute(generatedFiles, { glob: "**/.next/**", label: ".next/" }),
      contribute(generatedFiles, { glob: "**/.next-test-*/**" }),
      contribute(generatedFiles, {
        glob: "**/next-env.d.ts",
        label: "next-env.d.ts",
        note: "`vp run dev` refreshes `typedRoutes` and `PageProps`. A fresh clone runs `vp run typegen` before `vp check`.",
      }),
      contribute(ignoredFiles, ".next"),
      contribute(ignoredFiles, ".next-test-*"),
      contribute(ignoredFiles, "next-env.d.ts"),
      contribute(unitTestSources, "apps/web/src"),
      contribute(dockerRuntime, {
        cmd: ["node", "apps/web/server.js"],
        copies: [
          ["/app/apps/web/.next/standalone", "./"],
          ["/app/apps/web/.next/static", "./apps/web/.next/static"],
          ...(database ? [["/app/apps/web/dist", "./dist"] as const] : []),
        ],
        env: [["HOSTNAME", "0.0.0.0"]],
      }),
      contribute(agentsMap, {
        owns: `Next.js App Router app: pages and layouts in \`src/app/\`${hasBackend(ctx) ? ", route handlers" : ""}, client components in \`src/components/\`; e2e tests in \`tests/e2e/\``,
        path: "apps/web",
      }),
      ...backendContributions(ctx),
      contribute(
        agentsNotes,
        "This is Next.js 16. Before calling a Next API, read the matching guide in `apps/web/node_modules/next/dist/docs/`. `params` and `searchParams` are promises, and `middleware` is now `proxy`."
      ),
      contribute(readmeTagline, "Next.js"),
      contribute(stackHeadline, "Next.js"),
      contribute(readmeLayers, {
        choice:
          "Next.js 16 App Router, React 19 with React Compiler, typed routes",
        layer: "Framework",
      }),
      contribute(readmeLayers, {
        choice:
          "TanStack Query, prefetched in Server Components and hydrated, Tailwind 4",
        layer: "Data",
      }),
      contribute(
        readmeOpen,
        `Open http://localhost:3000${auth ? " and create an account" : ""}.${ctx.stack.api === undefined ? "" : " API docs are at http://localhost:3000/api."}`
      ),
    ];
  },
  id: "next",
  kind: "framework",
  name: "Next.js",
  description: "Full-stack React with the App Router and React Compiler",
  homepage: "https://nextjs.org",
  provides: ["frontend-framework", "fullstack-framework", "router"],
  requires: ["react", "node-runtime"],
});
