import oxfmt from "ultracite/oxfmt";

import {
  contribute,
  defineAddon,
  defineSlot,
  packageJson,
} from "@vibestart/core";

import {
  fmtPresets,
  lintOverrides,
  lintPlugins,
  lintPresets,
  toolConventions,
} from "#/vite-plus/slots.ts";

export const ultracitePresets = defineSlot<{ name: string; module: string }>(
  "ultracite/presets"
);
export const ultraciteOverrides = defineSlot<string>("ultracite/overrides");

export const ultracite = defineAddon({
  supportsAdd: true,
  contribute: (ctx) => [
    contribute(packageJson, {
      devDependencies: [
        "ultracite",
        ...(ctx.has("shadcn") ? ["@shadcn/lint"] : []),
      ],
      path: ".",
    }),
    contribute(fmtPresets, {
      config: oxfmt,
      module: "ultracite/oxfmt",
      name: "oxfmt",
    }),
    ...[
      { module: "ultracite/oxlint/core", name: "core" },
      ...ultracitePresets.values(ctx),
      { module: "ultracite/oxlint/anti-slop", name: "antiSlop" },
    ].map((preset) => contribute(lintPresets, preset)),
    ...ultraciteOverrides
      .values(ctx)
      .map((override) => contribute(lintOverrides, override)),
    ...(ctx.has("shadcn")
      ? [
          contribute(lintPlugins, {
            comment:
              "Knip reads this string. A spread of `shadcn.jsPlugins` is invisible to it.",
            name: "shadcn",
            specifier: "@shadcn/lint",
          }),
        ]
      : []),
    contribute(toolConventions, {
      text: "Run `vp check` to apply the Ultracite lint and formatting presets, including framework rules and anti-slop checks for AI-written code. Fix the reported code instead of disabling the rules.",
      title: "Ultracite",
    }),
  ],
  default: true,
  description:
    "Lint and formatting presets with framework rules and AI code quality checks",
  homepage: "https://www.ultracite.ai",
  id: "ultracite",
  name: "Ultracite",
});
