import type { Context } from "@vibestart/core";
import { contribute, packageJson } from "@vibestart/core";

import { stackHeadline } from "#/app.ts";
import { templateFiles } from "#/templates.ts";
import {
  agentsMap,
  readmeLayers,
  readmeOpen,
  readmeTagline,
} from "#/vite-plus/slots.ts";

export const effectSpa = (ctx: Context) => [
  ...templateFiles(ctx, "spa/effect"),
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
    owns: "React SPA: TanStack Router file routes, Effect Atom clients, Better Auth, and browser tests",
  }),
  contribute(readmeLayers, {
    layer: "Frontend",
    choice: "React 19, TanStack Router, Effect Atom, Tailwind CSS 4",
  }),
  contribute(readmeTagline, "Effect"),
  contribute(stackHeadline, "Effect"),
  contribute(
    readmeOpen,
    "Open http://localhost:5173 and create an account. API docs are at http://localhost:5173/api/docs. Vite proxies the API in development; the Effect server serves the SPA in production. Session cookies stay first-party."
  ),
];
