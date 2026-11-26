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
  requires: ["react", "single-page-app"],
  choices: {
    mode: ["standard"],
    backend: ["hono", null],
    api: [null],
    database: [null],
    desktop: [null],
    mobile: [null],
  },
  contribute: (ctx) => [
    ...templateFiles(ctx, "ui-sdk/react"),
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
    contribute(agentsConventions, {
      title: "UI",
      text: "Use the UI SDK components in `packages/ui`. The adapter ships its API and composition guides in `packages/ui/node_modules/@ui-sdk/react/docs`.",
    }),
    contribute(readmeLayers, {
      layer: "UI",
      choice: "UI SDK in `packages/ui`",
    }),
  ],
});
