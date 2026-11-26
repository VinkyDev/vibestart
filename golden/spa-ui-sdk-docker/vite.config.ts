import oxfmt from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import tanstack from "ultracite/oxlint/tanstack";
import vitest from "ultracite/oxlint/vitest";
import { defineConfig } from "vite-plus";

const generatedFiles = ["**/routeTree.gen.ts"];

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
    extends: [core, react, tanstack, vitest, antiSlop],
    ignorePatterns: [...(core.ignorePatterns ?? []), ...generatedFiles],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
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
    ],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  test: {
    passWithNoTests: true,
    projects: [
      {
        test: {
          include: ["packages/*/src/**/*.test.ts"],
          name: "unit",
        },
      },
    ],
  },
});
