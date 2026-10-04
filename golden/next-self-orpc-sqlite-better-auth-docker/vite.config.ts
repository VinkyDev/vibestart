import oxfmt from "ultracite/oxfmt";
import antiSlop from "ultracite/oxlint/anti-slop";
import core from "ultracite/oxlint/core";
import next from "ultracite/oxlint/next";
import react from "ultracite/oxlint/react";
import shadcn from "ultracite/oxlint/shadcn";
import vitest from "ultracite/oxlint/vitest";
import { defineConfig, loadEnv } from "vite-plus";

const generatedFiles = [
  ".vibestart/**",
  "**/.next/**",
  "**/.next-test-*/**",
  "**/next-env.d.ts",
  "packages/db/src/migrations/**",
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
      ignoreCase: true,
      newlinesBetween: true,
      order: "asc",
    },
  },
  lint: {
    extends: [core, react, next, shadcn, vitest, antiSlop],
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
          env: loadEnv("test", `${import.meta.dirname}/apps/web`, ""),
          include: ["packages/api/tests/integration/**/*.test.ts"],
          name: "integration",
        },
      },
      {
        test: {
          include: ["apps/web/src/**/*.test.ts", "packages/*/src/**/*.test.ts"],
          name: "unit",
        },
      },
    ],
  },
});
