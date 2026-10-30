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
        // This promise is only a synchronization signal, without a resolved value.
        files: ["apps/web/tests/e2e/**"],
        rules: { "typescript/no-invalid-void-type": "off" },
      },

      {
        // Effect services use `Service.use`, not React hooks, and colocate typed errors.
        files: ["packages/api/src/**"],
        rules: {
          "react-hooks/rules-of-hooks": "off",
          "eslint/max-classes-per-file": "off",
          // `Effect.map(effect, f)` is a dual API, not Array.map with thisArg.
          "unicorn/no-array-method-this-argument": "off",
        },
      },
      {
        // PostgreSQL text rejects NUL, so the boundary schema explicitly excludes it.
        files: ["packages/contracts/src/todo.ts"],
        rules: { "eslint/no-control-regex": "off" },
      },

      {
        // Effect's errors are `class X extends Schema.TaggedError<X>()(…)`, a factory call rather than a thrown
        // `Error()`; a contract module declares several of them, and a `Schema` value with a `type` of the same name.
        files: ["packages/contracts/src/**"],
        rules: {
          "eslint/max-classes-per-file": "off",
          "eslint/no-redeclare": "off",
          "unicorn/throw-new-error": "off",
        },
      },
      {
        // A flat Effect RPC client takes a `void` payload as an argument, since a generic tag cannot drop it.
        files: ["packages/api/tests/**"],
        rules: {
          "unicorn/no-useless-undefined": ["error", { checkArguments: false }],
        },
      },
      {
        // Atom clients are service classes, one per protocol, declared together.
        files: ["apps/web/src/lib/api.ts"],
        rules: {
          "eslint/max-classes-per-file": "off",
          // `runtime.fn<void>()` declares a mutation with no input.
          "typescript/no-invalid-void-type": "off",
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
              customHOCs: ["createFileRoute", "createRootRouteWithContext"],
            },
          ],
          // `beforeLoad` guards throw `redirect()`, which is a `Redirect` object rather than an `Error`.
          "typescript/only-throw-error": [
            "error",
            {
              allow: [
                {
                  from: "package",
                  package: "@tanstack/router-core",
                  name: "Redirect",
                },
              ],
            },
          ],
        },
      },
    ],
    rules: {
      // Effect programs are `Effect.gen(function* () { … })`; spans and `Effect.fn` names do what a name would.
      "eslint/func-names": ["error", "always", { generators: "never" }],
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
