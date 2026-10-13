import oxfmt from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import vitest from "ultracite/oxlint/vitest";
import { defineConfig, loadEnv } from "vite-plus";

const generatedFiles = ["apps/mobile/uniwind-types.d.ts"];

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
    extends: [core, react, vitest, antiSlop],
    ignorePatterns: [...(core.ignorePatterns ?? []), ...generatedFiles],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        // Hono middleware awaits `next()`, which is not a Node.js error-first callback.
        files: ["apps/server/src/**"],
        rules: { "node/callback-return": "off" },
      },
      {
        files: ["apps/mobile/**"],
        rules: {
          "react/style-prop-object": ["error", { allow: ["StatusBar"] }],
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
            "apps/mobile/src/**/*.test.ts",
            "packages/*/src/**/*.test.ts",
          ],
          name: "unit",
        },
      },
    ],
  },
});
