import oxfmt from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import tanstack from "ultracite/oxlint/tanstack";
import vitest from "ultracite/oxlint/vitest";
import { defineConfig, loadEnv } from "vite-plus";

const generatedFiles = [
  "**/routeTree.gen.ts",
  "packages/db/src/migrations/**",
  "**/.void/**",
];

const vendoredFiles = ["packages/ui/src/components/**"];

export default defineConfig({
  fmt: {
    ...oxfmt,
    ignorePatterns: [...(oxfmt.ignorePatterns ?? []), ...generatedFiles],
    proseWrap: "preserve",
    sortImports: {
      customGroups: [
        {
          elementNamePattern: ["@my-app/**"],
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
    },
  },
  lint: {
    extends: [core, react, tanstack, shadcn, vitest, antiSlop],
    ignorePatterns: [
      ...(core.ignorePatterns ?? []),
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
        // A loader throws `notFound()` and `beforeLoad` throws `redirect()`. Both are objects rather than an `Error`.
        files: ["apps/web/src/routes/**"],
        rules: {
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
        // Hono middleware awaits `next()`, which is not a Node.js error-first callback.
        files: ["apps/server/src/**"],
        rules: { "node/callback-return": "off" },
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
    projects: [
      {
        test: {
          env: loadEnv("test", `${import.meta.dirname}/apps/server`, ""),
          include: ["packages/api/tests/integration/**/*.test.ts"],
          name: "integration",
        },
      },
      {
        test: {
          include: [
            "apps/server/src/**/*.test.ts",
            "packages/*/src/**/*.test.ts",
          ],
          name: "unit",
        },
      },
    ],
  },
});
