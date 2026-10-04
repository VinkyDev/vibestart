import type { Context } from "@vibestart/core";
import { contribute, defineIntegration, packageJson } from "@vibestart/core";

import { templateFiles } from "#/templates.ts";
import { ultracitePresets } from "#/ultracite.ts";
import {
  agentsConventions,
  agentsMap,
  readmeLayers,
  vendoredFiles,
} from "#/vite-plus/slots.ts";

// Next.js renders Server Components: interactive components start with "use client", and `components.json` sets `rsc`.
const bundler = (ctx: Context) => (ctx.has("next") ? "next" : "vite");

export const shadcn = defineIntegration({
  contribute: (ctx) => [
    ...templateFiles(ctx, "shadcn/common"),
    ...templateFiles(ctx, `shadcn/${bundler(ctx)}`),
    ...(ctx.has("better-auth")
      ? templateFiles(ctx, `shadcn/${bundler(ctx)}-auth`)
      : []),
    contribute(packageJson, {
      dependencies: [
        "@base-ui/react",
        "@fontsource-variable/geist",
        "class-variance-authority",
        "cn",
        "lucide-react",
        "next-themes",
        "shadcn",
        "sonner",
        "tw-animate-css",
      ],
      devDependencies: [
        `${ctx.scope}/config`,
        "@types/react",
        "@types/react-dom",
        "react",
        "react-dom",
        "tailwindcss",
        "typescript",
      ],
      exports: {
        "./globals.css": "./src/styles/globals.css",
        "./components/*": "./src/components/*.tsx",
        "./lib/*": "./src/lib/*.ts",
      },
      path: "packages/ui",
      peerDependencies: ["react", "react-dom"],
    }),
    contribute(packageJson, {
      dependencies: [
        `${ctx.scope}/ui`,
        "lucide-react",
        "next-themes",
        "sonner",
      ],
      path: "apps/web",
    }),
    contribute(ultracitePresets, {
      module: "ultracite/oxlint/shadcn",
      name: "shadcn",
    }),
    contribute(vendoredFiles, "packages/ui/src/components/**"),
    contribute(agentsMap, {
      owns: "shadcn/ui components (Base UI), Tailwind theme in `src/styles/globals.css`",
      path: "packages/ui",
    }),
    contribute(agentsConventions, {
      text: `From \`packages/ui\`, run \`pnpm dlx shadcn@latest add <component>\` and import \`${ctx.scope}/ui/components/<name>\`. Files in \`packages/ui/src/components\` are vendored shadcn and are not linted. ${ctx.has("ultracite") ? "App code is checked by `@shadcn/lint`: style a component through its variants, and use `className` on it only for layout. " : ""}When the first file lands in \`src/hooks\`, add \`"./hooks/*": "./src/hooks/*.ts"\` to the package exports (\`components.json\` already aliases that path).`,
      title: "UI",
    }),
    contribute(readmeLayers, {
      choice: "shadcn/ui on Base UI, in `packages/ui`",
      layer: "UI",
    }),
  ],
  id: "shadcn",
  kind: "ui",
  name: "shadcn/ui",
  description: "Base UI components in a shared UI package",
  homepage: "https://ui.shadcn.com",
  provides: ["ui-components"],
  requires: ["react"],
});
