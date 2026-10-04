import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
  pnpmWorkspace,
} from "@vibestart/core";

import { hasBackend } from "#/app.ts";
import { knipEntries } from "#/knip.ts";
import { templateFiles } from "#/templates.ts";
import {
  agentsMap,
  agentsNotes,
  ignoredFiles,
  readmeLayers,
  readmeOpen,
  readmeTagline,
  unitTestSources,
} from "#/vite-plus/slots.ts";

const defaultApiOrigin = "http://localhost:3000";

const apiPaths = (ctx: Context) => {
  if (!hasBackend(ctx)) {
    return [];
  }
  return ctx.has("orpc") ? ["/rpc", "/api"] : ["/api"];
};

const config = (ctx: Context) =>
  file(
    "apps/desktop/src/main/config.ts",
    [
      `export const apiPaths: readonly string[] = [${apiPaths(ctx)
        .map((apiPath) => `"${apiPath}"`)
        .join(", ")}];`,
      "",
      `export const defaultApiOrigin = "${defaultApiOrigin}";`,
      "",
    ].join("\n")
  );

const architecture = (ctx: Context) => {
  const api = hasBackend(ctx)
    ? ` The packaged app forwards ${apiPaths(ctx)
        .map((apiPath) => `\`${apiPath}\``)
        .join(
          " and "
        )} to \`API_ORIGIN\` (default \`${defaultApiOrigin}\`) while keeping the renderer's \`Origin\` header${ctx.has("better-auth") ? "; `packages/auth` lists `https://app.localhost` in `trustedOrigins` for the packaged window" : ""}. In development the window loads the Vite dev server, which proxies the same paths through :5173.`
    : "";
  return `The desktop app wraps \`apps/web\`: \`vp run dev\` starts the web dev server and opens it in an Electron window; \`vp run package:desktop\` builds the web app and packages the installer with electron-builder. The window loads \`https://app.localhost/\`, an origin the main process answers itself from \`apps/web/dist\` with the SPA fallback.${api} Restart \`vp run dev\` after changing main or preload code. Main, preload, and the renderer share the IPC contract in \`packages/electron\`; the renderer reads it from \`window.desktop\`.`;
};

export const electron = defineIntegration({
  contribute: (ctx) => [
    ...templateFiles(ctx, "electron/common"),
    config(ctx),
    // The main and preload entries are built by `vp build --config`, which Knip's plugins do not read.
    contribute(knipEntries, {
      workspace: "apps/desktop",
      entry: [
        "src/main/index.ts",
        "src/preload/index.ts",
        "vite.main.config.ts",
        "vite.preload.config.ts",
      ],
    }),
    contribute(packageJson, {
      devDependencies: [
        `${ctx.scope}/config`,
        `${ctx.scope}/electron`,
        "@types/node",
        "electron",
        "electron-builder",
        "es-toolkit",
        "typescript",
        "vite-plus",
        "zod",
      ],
      imports: { "#src/*": "./src/*" },
      main: "./dist/main/index.js",
      path: "apps/desktop",
      scripts: {
        build:
          "vp build --config vite.main.config.ts && vp build --config vite.preload.config.ts",
        package: `vp run --filter ${ctx.scope}/web build && node scripts/copy-renderer.ts && vp run build && electron-builder --config electron-builder.yml`,
        dev: "vp run build && node scripts/dev.ts",
      },
    }),
    contribute(packageJson, {
      dependencies: ["zod"],
      devDependencies: [`${ctx.scope}/config`, "@types/node", "typescript"],
      exports: { ".": "./src/index.ts" },
      imports: { "#src/*": "./src/*" },
      path: "packages/electron",
    }),
    contribute(packageJson, {
      path: ".",
      scripts: {
        "package:desktop": `vp run --filter ${ctx.scope}/desktop package`,
      },
    }),
    // The Electron binary is downloaded by its install script. electron-builder's Squirrel.Windows helper does not need one.
    contribute(pnpmWorkspace, {
      allowBuilds: { electron: true, "electron-winstaller": false },
    }),
    contribute(unitTestSources, "apps/desktop/src"),
    ...(ctx.has("better-auth")
      ? [
          contribute(packageJson, {
            dependencies: [`${ctx.scope}/electron`],
            path: "packages/auth",
          }),
        ]
      : []),
    contribute(ignoredFiles, "release"),
    contribute(agentsMap, {
      owns: "Electron main and preload processes, the `https://app.localhost/` renderer server, IPC handlers, and electron-builder config",
      path: "apps/desktop",
    }),
    contribute(agentsMap, {
      owns: "The IPC contract: channel names, payload schemas, and the `window.desktop` type",
      path: "packages/electron",
    }),
    contribute(agentsNotes, architecture(ctx)),
    contribute(readmeTagline, "Electron"),
    contribute(readmeLayers, {
      choice:
        "Electron (main, preload, and the web app as renderer), packaged with electron-builder",
      layer: "Desktop",
    }),
    contribute(
      readmeOpen,
      "`vp run dev` also opens the app in an Electron window. `vp run package:desktop` writes the installer to `apps/desktop/release`."
    ),
  ],
  id: "electron",
  kind: "desktop",
  name: "Electron",
  description: "Desktop app around the web app, packaged with electron-builder",
  homepage: "https://www.electronjs.org",
  requires: ["single-page-app"],
});
