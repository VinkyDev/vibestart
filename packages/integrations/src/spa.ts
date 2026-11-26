import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
} from "@vibestart/core";

import { hasBackend } from "#/app-shape.ts";
import { databaseFlow } from "#/database.ts";
import { authVariant, todosExample } from "#/example.ts";
import { rpcPath, serverPaths } from "#/request-paths.ts";
import { devServer } from "#/server-address.ts";
import { effectSpa } from "#/spa/effect.ts";
import { solidSpa } from "#/spa/solid.ts";
import { viteConfig } from "#/spa/vite-config.ts";
import { stackHeadline } from "#/stack-headline.ts";
import { replaceOnce, templateContent, templateFiles } from "#/templates.ts";
import {
  agentsMap,
  agentsNotes,
  readmeLayers,
  readmeOpen,
  readmeTagline,
} from "#/vite-plus/slots.ts";
import { homePage } from "#/web-pages.ts";

const proxied = (ctx: Context) =>
  serverPaths(ctx)
    .map((path) => `\`${path}\``)
    .join(" and ");

const flow = (ctx: Context) => {
  const { port } = devServer(ctx.stack);

  if (ctx.has("orpc")) {
    return `\`vp run dev\` serves the web app on :5173 and the API on :${port}. Request flow: \`apps/web\` → \`api.*\` (\`src/lib/api.ts\`) → \`POST ${rpcPath(ctx)}/*\` → \`packages/api\` procedure${databaseFlow(ctx)}.`;
  }

  if (!ctx.has("openapi")) {
    return `\`vp run dev\` serves the web app on :5173 and the server on :${port}.`;
  }

  const client = todosExample(ctx.stack) ? " → `api.*` (`src/lib/api.ts`)" : "";

  return `\`vp run dev\` serves the web app on :5173 and the API on :${port}. Request flow: \`apps/web\`${client} → \`/api/*\` → \`packages/api\` route${databaseFlow(ctx)}.`;
};

const workersHosting =
  "Cloudflare serves the SPA through Workers Static Assets and routes /api requests to Hono";

const requestFlow = (ctx: Context) => {
  if (!hasBackend(ctx.stack)) {
    return "`vp run dev` serves the app on :5173. `vp run build` writes static files to `apps/web/dist`; there is no server.";
  }

  const host = ctx.has("workers")
    ? workersHosting
    : "the server serves the SPA itself";

  return ctx.has("better-auth")
    ? `${flow(ctx)} In development Vite proxies ${proxied(ctx)} (including \`/api/auth\`) to the server; in production ${host}. The browser only ever sees one origin, so session cookies are first-party and there is no CORS configuration. Keep it that way: \`BETTER_AUTH_URL\` is the browser-facing origin (\`http://localhost:5173\` in development), and Better Auth rejects auth requests whose \`Origin\` differs from it.`
    : `${flow(ctx)} In development Vite proxies ${proxied(ctx)} to the server; in production ${host}, so everything is same-origin.`;
};

const open = (ctx: Context) => {
  if (!hasBackend(ctx.stack)) {
    return ["Open http://localhost:5173."];
  }

  const docs =
    ctx.stack.api === undefined
      ? ""
      : " API docs are at http://localhost:5173/api.";

  return ctx.has("better-auth")
    ? [
        `Open http://localhost:5173 and create an account.${docs}`,
        `The browser always talks to one origin: in development Vite proxies ${proxied(ctx)} to the server, in production ${ctx.has("workers") ? workersHosting : "the server serves the SPA"}. Session cookies therefore stay first-party and no CORS is configured. \`BETTER_AUTH_URL\` is that browser-facing origin (\`http://localhost:5173\` in development), not the server's own port.`,
      ]
    : [`Open http://localhost:5173.${docs}`];
};

const orpcClientPath = "apps/web/src/lib/api.ts";

const orpcClient = (ctx: Context) =>
  file(
    orpcClientPath,
    replaceOnce(
      templateContent(ctx, "spa/orpc", orpcClientPath),
      "/rpc`",
      `${rpcPath(ctx)}\``,
      `spa/orpc/${orpcClientPath}`
    )
  );

const setupNotes = (ctx: Context) => [
  contribute(agentsNotes, requestFlow(ctx)),
  ...open(ctx).map((paragraph) => contribute(readmeOpen, paragraph)),
];

const webPackage = (ctx: Context) =>
  contribute(packageJson, {
    devDependencies: [
      `${ctx.scope}/config`,
      "@tailwindcss/vite",
      "@tanstack/router-plugin",
      "@types/node",
      "@vitejs/plugin-react",
      "oxc-transform-react",
      "typescript",
      "vite",
      "vite-plus",
    ],
    imports: { "#src/*": "./src/*" },
    path: "apps/web",
    scripts: {
      dev: "vp dev",
      build: "vp build",
      preview: "vp preview",
    },
  });

export const spa = defineIntegration({
  contribute: (ctx) => {
    if (ctx.has("solid")) {
      return [
        ...solidSpa(ctx),
        viteConfig(ctx),
        ...(ctx.has("effect") ? [] : setupNotes(ctx)),
      ];
    }

    return [
      viteConfig(ctx),
      webPackage(ctx),
      contribute(stackHeadline, { name: "React", role: "Frontend" }),
      ...(ctx.has("effect")
        ? effectSpa(ctx)
        : [
            ...templateFiles(ctx, "spa/common"),
            ...templateFiles(ctx, `spa/${authVariant(ctx.stack)}`),
            ...(ctx.has("orpc") ? [orpcClient(ctx)] : []),
            ...(todosExample(ctx.stack) && !ctx.has("better-auth")
              ? templateFiles(ctx, "spa/todos")
              : []),
            ...homePage(ctx, "apps/web/src/routes/index.tsx", true),
            contribute(agentsMap, {
              owns: `React SPA: TanStack Router file routes, TanStack Query${ctx.has("better-auth") ? ", the Better Auth client" : ""}; e2e tests in \`tests/e2e/\``,
              path: "apps/web",
            }),
            contribute(readmeTagline, "React"),
            contribute(readmeLayers, {
              choice:
                "React 19, TanStack Router, TanStack Query, Tailwind CSS 4",
              layer: "Frontend",
            }),
            ...setupNotes(ctx),
          ]),
    ];
  },
  id: "spa",
  kind: "framework",
  name: "Vite",
  description: "Client-rendered web app built with Vite",
  homepage: "https://vite.dev",
  provides: ["frontend-framework", "single-page-app"],
  requires: [["react", "solid"], "router"],
});
