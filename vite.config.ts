import oxfmt from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import tanstack from "ultracite/oxlint/tanstack";
import vitest from "ultracite/oxlint/vitest";
import { defineConfig } from "vite-plus";

// Golden projects are separate workspaces checked by their own config; templates
// are fragments of generated projects and are checked through generated output.
// Agent skills are installed from upstream and pinned by hash in `skills-lock.json`, so reformatting one makes it drift.
const foreignFiles = [
  ".agents/skills/**",
  "golden/**",
  "reference/**",
  "packages/integrations/templates/**",
];
const generatedFiles = [
  "**/routeTree.gen.ts",
  "apps/web/.source/**",
  "apps/web/src/paraglide/**",
];
const vendoredFiles = ["packages/ui/src/components/**"];

export default defineConfig({
  fmt: {
    ...oxfmt,
    ignorePatterns: [
      ...(oxfmt.ignorePatterns ?? []),
      ...foreignFiles,
      ...generatedFiles,
    ],
    proseWrap: "preserve",
    sortImports: {
      // Workspace packages sort as their own group, between npm packages and `#/` imports.
      customGroups: [
        {
          elementNamePattern: ["@vibestart/**"],
          groupName: "workspace",
        },
      ],
      groups: [
        "builtin",
        "external",
        "workspace",
        ["internal", "subpath"],
        ["parent", "sibling", "index"],
        "style",
        "unknown",
      ],
      ignoreCase: true,
      newlinesBetween: true,
      order: "asc",
    },
  },
  lint: {
    extends: [core, react, tanstack, shadcn, vitest, antiSlop],
    ignorePatterns: [
      ...(core.ignorePatterns ?? []),
      ...foreignFiles,
      ...generatedFiles,
      ...vendoredFiles,
    ],
    jsPlugins: [
      // Knip reads this string. A spread of `shadcn.jsPlugins` is invisible to it.
      { name: "shadcn", specifier: "@shadcn/lint" },
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
    ],
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        // Key order in integration contributions is the key order of the generated file.
        files: ["packages/integrations/src/**"],
        rules: { "eslint/sort-keys": "off" },
      },
      {
        // The key order of the CLI's citty `args` is the order of its --help.
        files: ["apps/cli/src/options.ts"],
        rules: { "eslint/sort-keys": "off" },
      },
      {
        // Shiki paints each token with the theme's own color. That color is grammar data, not a design-system choice.
        files: [
          "apps/web/src/components/code-view.tsx",
          "apps/web/src/components/home/demo/change-demo.tsx",
        ],
        rules: { "shadcn/no-inline-styles": "off" },
      },
      {
        // Motion writes the mark's blocks from pointer values it owns, so the position is a motion value, not a class.
        files: ["apps/web/src/components/home/finale.tsx"],
        rules: { "shadcn/no-inline-styles": "off" },
      },
      {
        // React's `use` suspends on one stable promise per key. An async function would return a new promise every call.
        files: [
          "apps/web/src/lib/highlight.ts",
          "apps/web/src/lib/projects.ts",
        ],
        rules: { "typescript/promise-function-async": "off" },
      },
      {
        files: ["apps/web/src/routes/**"],
        rules: {
          // TanStack Router infers a route's options in order, so `head` reads the type `loader` returns
          // only when it comes after it.
          "eslint/sort-keys": "off",
          // A route module exports its `Route` beside the components it renders.
          "react/only-export-components": [
            "warn",
            {
              allowExportNames: ["Route"],
              customHOCs: ["createFileRoute", "createRootRoute"],
            },
          ],
          // A loader throws `notFound()` and `beforeLoad` throws `redirect()`. Both are objects rather than an `Error`.
          "typescript/only-throw-error": [
            "error",
            {
              allow: [
                {
                  from: "package",
                  name: "NotFoundError",
                  package: "@tanstack/router-core",
                },
                {
                  from: "package",
                  name: "Redirect",
                  package: "@tanstack/router-core",
                },
              ],
            },
          ],
        },
      },
      {
        // clack prompts are asked one after another, and each project command needs the one before it.
        files: [
          "apps/cli/src/create.ts",
          "apps/cli/src/prompts.ts",
          "apps/cli/src/maintenance/transaction.ts",
        ],
        rules: { "eslint/no-await-in-loop": "off" },
      },
    ],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  test: {
    // Matrix suites each invoke the native formatter; bound file parallelism to avoid oversubscription.
    maxWorkers: 4,
    // `packages/config` and `packages/ui` have no tests.
    projects: [
      "apps/cli",
      "apps/web",
      "packages/core",
      "packages/integrations",
    ],
  },
});
