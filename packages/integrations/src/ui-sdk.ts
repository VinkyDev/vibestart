import { contribute, defineIntegration, packageJson } from "@vibestart/core";

import { templateFiles } from "#/templates.ts";
import { agentsConventions, readmeLayers } from "#/vite-plus/slots.ts";

export const uiSdk = defineIntegration({
  id: "ui-sdk",
  kind: "ui",
  name: "UI SDK",
  description: "Accessible UI SDK components in a shared UI package",
  homepage: "https://ui-sdk.dev",
  provides: ["ui-components"],
  requires: [["react", "solid"], "single-page-app"],
  choices: {
    mode: ["standard"],
    backend: ["hono", null],
    api: [null],
    database: [null],
    desktop: [null],
    mobile: [null],
  },
  contribute: (ctx) => [
    ...templateFiles(ctx, "ui-sdk/common"),
    ...templateFiles(ctx, ctx.has("solid") ? "ui-sdk/solid" : "ui-sdk/react"),
    ...(ctx.has("solid")
      ? [
          contribute(packageJson, {
            path: "packages/ui",
            dependencies: ["@ui-sdk/solid", "@ui-sdk/core"],
            peerDependencies: ["solid-js", "@solidjs/web"],
            devDependencies: [
              `${ctx.scope}/config`,
              "solid-js",
              "@solidjs/web",
              "tailwindcss",
              "typescript",
            ],
            exports: {
              "./globals.css": "./src/styles/globals.css",
              "./components/*": "./src/components/*.tsx",
            },
          }),
          contribute(packageJson, {
            path: "apps/web",
            dependencies: [`${ctx.scope}/ui`],
          }),
        ]
      : [
          contribute(packageJson, {
            path: "packages/ui",
            dependencies: [
              "@ui-sdk/core",
              "@ui-sdk/react",
              "cn",
              "lucide-react",
              "sonner",
            ],
            devDependencies: [
              `${ctx.scope}/config`,
              "@types/react",
              "react",
              "react-dom",
              "tailwindcss",
              "typescript",
            ],
            peerDependencies: ["react", "react-dom"],
            exports: {
              "./globals.css": "./src/styles/globals.css",
              "./components/*": "./src/components/*.tsx",
              "./lib/*": "./src/lib/*.ts",
            },
          }),
          contribute(packageJson, {
            path: "apps/web",
            dependencies: [
              `${ctx.scope}/ui`,
              "lucide-react",
              "motion",
              "next-themes",
              "sonner",
            ],
          }),
        ]),
    contribute(agentsConventions, {
      title: "UI",
      text: `Use the UI SDK components in \`packages/ui\`. The adapter ships its API and composition guides in \`packages/ui/node_modules/@ui-sdk/${ctx.has("solid") ? "solid" : "react"}/docs\`.`,
    }),
    contribute(readmeLayers, {
      layer: "UI",
      choice: "UI SDK in `packages/ui`",
    }),
  ],
});
