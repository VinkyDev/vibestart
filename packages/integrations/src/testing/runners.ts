import type { Context, Contribution } from "@vibestart/core";
import { contribute, file } from "@vibestart/core";

import { knipEntries } from "#/knip.ts";
import { templateContent, templateFiles } from "#/templates.ts";
import { ignoredFiles, readmeCommandNotes } from "#/vite-plus/slots.ts";

export interface BrowserRunner {
  readonly name: string;
  readonly templates: string;
  readonly devDependencies: readonly string[];
  readonly command: string;
  readonly installer: string;
  readonly startsStack: string;
  readonly practice: readonly string[];
  readonly contribute: (ctx: Context) => readonly Contribution[];
}

export const playwright: BrowserRunner = {
  command: "playwright test",
  contribute: (ctx) => [
    ...templateFiles(ctx, "testing/playwright/runner"),
    contribute(ignoredFiles, "playwright-report"),
    contribute(ignoredFiles, "test-results"),
  ],
  devDependencies: ["@playwright/test"],
  installer: "playwright",
  name: "Playwright",
  practice: [
    'Open and reload pages with `visit()` (`waitUntil: "networkidle"`) before clicking. Server-rendered pages hydrate after load, and a click before hydration does nothing. Assert with Playwright\'s web-first assertions (`toBeVisible`, `toHaveURL`, `toBeChecked`).',
  ],
  startsStack: "`apps/web/tests/support/server.ts` starts",
  templates: "testing/playwright",
};

const e2eConfigPath = "apps/web/e2e.config.ts";
const forwardedVariables = '["CI", "DATABASE_URL"]';

// SQLite test databases are temporary files; PostgreSQL creates them beside the shell's `DATABASE_URL`.
const e2eConfig = (ctx: Context) => {
  const config = templateContent(ctx, "testing/e2e/runner", e2eConfigPath);
  if (!config.includes(forwardedVariables)) {
    throw new Error(
      `testing/e2e/runner/${e2eConfigPath} does not forward ${forwardedVariables}`
    );
  }
  return file(
    e2eConfigPath,
    ctx.has("postgres") ? config : config.replace(forwardedVariables, '["CI"]')
  );
};

export const e2e: BrowserRunner = {
  command: "e2e run",
  contribute: (ctx) => [
    e2eConfig(ctx),
    ...templateFiles(ctx, "testing/e2e/runner", { except: [e2eConfigPath] }),
    contribute(ignoredFiles, ".e2e"),
    // Knip has no plugin for this runner, which loads its config and discovers the tests itself.
    contribute(knipEntries, {
      entry: [
        "e2e.config.ts",
        "tests/e2e/**/*.e2e.ts",
        "tests/support/start.ts",
      ],
      workspace: "apps/web",
    }),
    contribute(
      readmeCommandNotes,
      "TesterArmy e2e sends anonymous usage telemetry; set `E2E_TELEMETRY_DISABLED=1` to turn it off."
    ),
  ],
  devDependencies: ["e2e", "@e2e-dev/web"],
  installer: "e2e-web",
  name: "TesterArmy e2e",
  practice: [
    'Use `visit()` and `reload()` (`waitUntil: "networkidle"`) before interacting so server-rendered pages finish hydrating. Query with `screen`, act with `tap()` and `fill()`, and assert with `expect` from `e2e`. Generated tests need no model; configure an agent in `e2e.config.ts` for natural-language steps.',
    "The app command inherits only `PATH`, `HOME`, temporary-directory variables, and `e2e.config.ts` overrides. Forward any additional required variables there. Logs: `apps/web/.e2e/server.log`; report: `.e2e/report.json`; failure traces: `.e2e/artifacts`. Rerun failures from `apps/web` with `vp exec e2e run --last-failed`.",
  ],
  startsStack:
    "`apps/web/e2e.config.ts` runs `tests/support/start.ts` to start",
  templates: "testing/e2e",
};
