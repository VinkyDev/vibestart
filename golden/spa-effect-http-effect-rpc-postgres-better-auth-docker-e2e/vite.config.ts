import oxfmt from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import tanstack from "ultracite/oxlint/tanstack";
import vitest from "ultracite/oxlint/vitest";
import { defineConfig, loadEnv } from "vite-plus";

const generatedFiles = ["**/routeTree.gen.ts", "packages/db/src/migrations/**"];

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
      ignoreCase: true,
      newlinesBetween: true,
      order: "asc",
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
        // Effect.gen and Effect.fn generators carry operation names through tracing.
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
          "eslint/func-names": ["error", "always", { generators: "never" }],
        },
      },
      {
        files: ["apps/web/src/routes/**"],
        rules: {
          // A route module exports its `Route` beside the components it renders.
          "react/only-export-components": [
            "warn",
            {
              allowExportNames: ["Route"],
              customHOCs: [
                "createFileRoute",
                "createRootRoute",
                "createRootRouteWithContext",
              ],
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
        // Effect services expose Service.use and colocate their typed errors.
        files: ["packages/api/src/**"],
        rules: {
          "react-hooks/rules-of-hooks": "off",
          "eslint/max-classes-per-file": "off",
          "unicorn/no-array-method-this-argument": "off",
        },
      },
      {
        // PostgreSQL text rejects NUL, which the boundary schema excludes.
        files: ["packages/contracts/src/todo.ts"],
        rules: { "eslint/no-control-regex": "off" },
      },
      {
        // Schema.TaggedError is a class factory; contract modules colocate schema values and types.
        files: ["packages/contracts/src/**"],
        rules: {
          "eslint/max-classes-per-file": "off",
          "eslint/no-redeclare": "off",
          "unicorn/throw-new-error": "off",
        },
      },
      {
        // Atom clients are service classes; runtime.fn<void>() declares a mutation without input.
        files: ["apps/web/src/lib/api.ts"],
        rules: {
          "eslint/max-classes-per-file": "off",
          "typescript/no-invalid-void-type": "off",
        },
      },
      {
        // This promise is only a synchronization signal, without a resolved value.
        files: ["apps/web/tests/e2e/**"],
        rules: { "typescript/no-invalid-void-type": "off" },
      },
      {
        // The generic RPC client takes an explicit void payload.
        files: ["packages/api/tests/**"],
        rules: {
          "unicorn/no-useless-undefined": ["error", { checkArguments: false }],
        },
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
