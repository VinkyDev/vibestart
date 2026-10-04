import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
} from "@vibestart/core";

import {
  authVariant,
  databaseFlow,
  hasBackend,
  homePage,
  stackHeadline,
  todosExample,
} from "#/app.ts";
import { templateContent, templateFiles } from "#/templates.ts";
import {
  agentsMap,
  agentsNotes,
  readmeLayers,
  readmeOpen,
  readmeTagline,
} from "#/vite-plus/slots.ts";

const viteConfigPath = "apps/web/vite.config.ts";
const rpcProxy = '        "/rpc": SERVER_URL,\n';

const proxied = (ctx: Context) =>
  ctx.has("orpc") ? "`/rpc` and `/api`" : "`/api`";

const flow = (ctx: Context) => {
  if (ctx.has("orpc")) {
    return `\`vp run dev\` serves the web app on :5173 and the API on :3000. Request flow: \`apps/web\` → \`api.*\` (\`src/lib/api.ts\`) → \`POST /rpc/*\` → \`packages/api\` procedure${databaseFlow(ctx)}.`;
  }
  if (!ctx.has("openapi")) {
    return "`vp run dev` serves the web app on :5173 and the server on :3000.";
  }
  const client = todosExample(ctx) ? " → `api.*` (`src/lib/api.ts`)" : "";
  return `\`vp run dev\` serves the web app on :5173 and the API on :3000. Request flow: \`apps/web\`${client} → \`/api/*\` → \`packages/api\` route${databaseFlow(ctx)}.`;
};

const requestFlow = (ctx: Context) => {
  if (!hasBackend(ctx)) {
    return "`vp run dev` serves the app on :5173. `vp run build` writes static files to `apps/web/dist`; there is no server.";
  }
  return ctx.has("better-auth")
    ? `${flow(ctx)} In development Vite proxies ${proxied(ctx)} (including \`/api/auth\`) to the server; in production the server serves the SPA itself. The browser only ever sees one origin, so session cookies are first-party and there is no CORS configuration. Keep it that way: \`BETTER_AUTH_URL\` is the browser-facing origin (\`http://localhost:5173\` in development), and Better Auth rejects auth requests whose \`Origin\` differs from it.`
    : `${flow(ctx)} In development Vite proxies ${proxied(ctx)} to the server; in production the server serves the SPA itself, so everything is same-origin.`;
};

const open = (ctx: Context) => {
  if (!hasBackend(ctx)) {
    return ["Open http://localhost:5173."];
  }
  const docs =
    ctx.stack.api === undefined
      ? ""
      : " API docs are at http://localhost:5173/api.";
  return ctx.has("better-auth")
    ? [
        `Open http://localhost:5173 and create an account.${docs}`,
        `The browser always talks to one origin: in development Vite proxies ${proxied(ctx)} to the server, in production the server serves the SPA. Session cookies therefore stay first-party and no CORS is configured. \`BETTER_AUTH_URL\` is that browser-facing origin (\`http://localhost:5173\` in development), not the server's own port.`,
      ]
    : [`Open http://localhost:5173.${docs}`];
};

// Without oRPC the server has no `/rpc` for Vite to proxy.
const viteConfig = (ctx: Context) => {
  if (!hasBackend(ctx)) {
    return templateFiles(ctx, "spa/static");
  }
  const config = templateContent(ctx, "spa/proxy", viteConfigPath);
  if (!config.includes(rpcProxy)) {
    throw new Error(`spa/proxy/${viteConfigPath} has no /rpc proxy`);
  }
  return [
    file(
      viteConfigPath,
      ctx.has("orpc") ? config : config.replace(rpcProxy, "")
    ),
  ];
};

export const spa = defineIntegration({
  contribute: (ctx) => [
    ...templateFiles(ctx, "spa/common"),
    ...templateFiles(ctx, `spa/${authVariant(ctx)}`),
    ...viteConfig(ctx),
    ...(ctx.has("orpc") ? templateFiles(ctx, "spa/orpc") : []),
    ...(todosExample(ctx) && !ctx.has("better-auth")
      ? templateFiles(ctx, "spa/todos")
      : []),
    homePage(ctx, "apps/web/src/routes/index.tsx", true),
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
      scripts: { dev: "vp dev", build: "vp build", preview: "vp preview" },
    }),
    contribute(agentsMap, {
      owns: `React SPA: TanStack Router file routes, TanStack Query${ctx.has("better-auth") ? ", the Better Auth client" : ""}; e2e tests in \`tests/e2e/\``,
      path: "apps/web",
    }),
    contribute(agentsNotes, requestFlow(ctx)),
    contribute(readmeTagline, "React"),
    contribute(stackHeadline, "React"),
    contribute(readmeLayers, {
      choice: "React 19, TanStack Router, TanStack Query, Tailwind CSS 4",
      layer: "Frontend",
    }),
    ...open(ctx).map((paragraph) => contribute(readmeOpen, paragraph)),
  ],
  id: "spa",
  kind: "framework",
  name: "TanStack Router (Vite)",
  description: "Client-rendered React app built with Vite",
  homepage: "https://vite.dev",
  provides: ["frontend-framework", "single-page-app"],
  requires: ["react", "router"],
});
