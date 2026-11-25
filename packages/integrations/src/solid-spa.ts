import {
  contribute,
  defineIntegration,
  file,
  packageJson,
} from "@vibestart/core";

import { hasBackend } from "#/app.ts";
import { templateContent, templateFiles } from "#/templates.ts";
import {
  agentsMap,
  readmeOpen,
  readmeTagline,
  unitTestSources,
} from "#/vite-plus/slots.ts";

export const solidSpa = defineIntegration({
  id: "solid-spa",
  kind: "framework",
  name: "Solid Router (Vite)",
  description: "Client-rendered Solid app built with Vite",
  homepage: "https://docs.solidjs.com/",
  provides: ["frontend-framework", "single-page-app"],
  requires: ["solid", "router"],
  contribute: (ctx) => {
    const backend = hasBackend(ctx);

    return [
      ...templateFiles(ctx, "solid-spa/common"),
      ...["index.html", "tsconfig.json", "tsconfig.node.json"].map((name) => {
        const path = `apps/web/${name}`;

        return file(path, templateContent(ctx, "spa/common", path));
      }),
      ...(backend ? templateFiles(ctx, "solid-spa/hono") : []),
      file(
        "apps/web/src/home.tsx",
        [
          ...(backend
            ? [
                'import { Loading } from "solid-js";',
                "",
                'import { ApiStatus } from "#src/api-status.tsx";',
                "",
              ]
            : []),
          "export const Home = () => (",
          '  <main class="mx-auto grid max-w-3xl gap-4 px-6 py-16">',
          `    <h1 class="text-4xl font-semibold">${ctx.name}</h1>`,
          "    <p>Solid 2 and UI SDK on Vite+.</p>",
          ...(backend
            ? [
                "    <Loading fallback={<output>Checking API…</output>}><ApiStatus /></Loading>",
              ]
            : []),
          "  </main>",
          ");",
        ].join("\n")
      ),
      file(
        "apps/web/vite.config.ts",
        [
          'import solid from "@solidjs/vite-plugin";',
          'import tailwindcss from "@tailwindcss/vite";',
          `import { defineConfig${backend ? ", loadEnv" : ""} } from "vite-plus";`,
          "",
          backend
            ? "export default defineConfig(({ mode }) => ({"
            : "export default defineConfig({",
          "  plugins: [solid(), tailwindcss()],",
          ...(backend
            ? [
                '  server: { proxy: { "/api": loadEnv(mode, import.meta.dirname, "").SERVER_URL ?? "http://localhost:3000" } },',
              ]
            : []),
          backend ? "}));" : "});",
        ].join("\n")
      ),
      contribute(packageJson, {
        path: "apps/web",
        devDependencies: [
          `${ctx.scope}/config`,
          "@solidjs/vite-plugin",
          "@tailwindcss/vite",
          "@types/node",
          "typescript",
          "vite",
          "vite-plus",
        ],
        imports: { "#src/*": "./src/*" },
        scripts: { dev: "vp dev", build: "vp build", preview: "vp preview" },
      }),
      contribute(agentsMap, {
        path: "apps/web",
        owns: "Solid 2 pages, client-side routing and browser tests",
      }),
      contribute(unitTestSources, "apps/web/src"),
      contribute(readmeTagline, "Solid 2"),
      contribute(readmeOpen, "Open http://localhost:5173."),
    ];
  },
});
