import type { Context } from "@vibestart/core";
import { contribute, packageJson } from "@vibestart/core";

import { knipEntries } from "#/knip.ts";
import { templateFiles } from "#/templates.ts";
import { ultracitePresets } from "#/ultracite.ts";
import {
  agentsSections,
  ignoredFiles,
  readmeCommandNotes,
  readySteps,
  testProjects,
} from "#/vite-plus/slots.ts";

import agentsTestsIntro from "./agents-tests-intro.md?raw";
import effectTests from "./effect-agents.md?raw";

export const effectTesting = (ctx: Context) => [
  ...templateFiles(ctx, "testing/database"),
  ...templateFiles(ctx, "testing/e2e/runner", {
    except: ["apps/web/tests/support/start.ts"],
  }),
  ...templateFiles(ctx, "testing/effect"),
  contribute(packageJson, {
    path: "apps/web",
    devDependencies: [
      "@e2e-dev/web",
      "@effect/platform-node",
      `${ctx.scope}/db`,
      "e2e",
    ],
    scripts: { "test:e2e": "e2e run" },
  }),
  contribute(packageJson, {
    path: "packages/api",
    devDependencies: ["@effect/sql-pg", "@effect/vitest", "vitest"],
  }),
  contribute(packageJson, {
    path: ".",
    scripts: { "test:e2e": `vp run --filter ${ctx.scope}/web test:e2e` },
  }),
  contribute(testProjects, {
    envDir: "apps/server",
    include: "packages/api/tests/integration/**/*.test.ts",
    name: "integration",
  }),
  contribute(readySteps, {
    command: "vp run test:e2e",
    description:
      "end-to-end tests against the real Effect server and PostgreSQL",
    label: "test:e2e",
    phase: "verify",
  }),
  contribute(ignoredFiles, ".e2e"),
  contribute(knipEntries, {
    workspace: "apps/web",
    entry: ["e2e.config.ts", "tests/e2e/**/*.e2e.ts", "tests/support/start.ts"],
  }),
  contribute(ultracitePresets, {
    module: "ultracite/oxlint/vitest",
    name: "vitest",
  }),
  contribute(
    agentsSections,
    `${agentsTestsIntro.trimEnd()}\n\n${effectTests.trimEnd()}`
  ),
  contribute(
    readmeCommandNotes,
    "The first `vp run test:e2e` needs Chromium: `cd apps/web && vp exec e2e-web install chromium`. TesterArmy e2e sends anonymous usage telemetry; set `E2E_TELEMETRY_DISABLED=1` to turn it off."
  ),
];
