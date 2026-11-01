import type { Context } from "@vibestart/core";
import { contribute, file, packageJson, renderFile } from "@vibestart/core";

import { listStack, stackHeadline } from "#/app.ts";
import { replaceOnce, templateContent, templateFiles } from "#/templates.ts";
import {
  agentsMap,
  readmeLayers,
  readmeOpen,
  readmeTagline,
} from "#/vite-plus/slots.ts";

const spaFiles = (ctx: Context) => {
  const router = "apps/web/src/router.tsx";
  const home = "apps/web/src/routes/index.tsx";

  return [
    ...templateFiles(ctx, "spa/effect", { except: [router, home] }),
    ...templateFiles(
      ctx,
      ctx.has("better-auth") ? "spa/effect-auth" : "spa/effect-public"
    ),
    file(
      router,
      ctx.has("better-auth")
        ? templateContent(ctx, "spa/effect", router)
        : replaceOnce(
            templateContent(ctx, "spa/effect", router),
            "    context: { session: null },\n",
            "",
            router
          )
    ),
    renderFile(home, (read) =>
      replaceOnce(
        templateContent(ctx, "spa/effect", home),
        "React, Effect (HttpApi, RPC, Atom), PostgreSQL, Drizzle and Better Auth\n        on Vite+.",
        `${listStack(read(stackHeadline))} on Vite+.`,
        home
      )
    ),
  ];
};

export const effectSpa = (ctx: Context) => [
  ...templateFiles(ctx, "spa/common", {
    except: ["apps/web/src/router.tsx"],
  }),
  ...templateFiles(ctx, "spa/proxy"),
  ...spaFiles(ctx),
  contribute(stackHeadline, "React"),
  contribute(packageJson, {
    path: "apps/web",
    imports: { "#src/*": "./src/*" },
    scripts: { dev: "vp dev", build: "vp build", preview: "vp preview" },
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
  }),
  contribute(agentsMap, {
    path: "apps/web",
    owns: `React SPA: TanStack Router file routes, Effect Atom clients${ctx.has("better-auth") ? ", Better Auth" : ""}, and browser tests`,
  }),
  contribute(readmeLayers, {
    layer: "Frontend",
    choice: "React 19, TanStack Router, Effect Atom, Tailwind CSS 4",
  }),
  contribute(readmeTagline, "Effect"),
  contribute(
    readmeOpen,
    `Open http://localhost:5173${ctx.has("better-auth") ? " and create an account" : ""}. API docs are at http://localhost:5173/api/docs. Vite proxies the API in development; the Effect server serves the SPA in production.`
  ),
];
