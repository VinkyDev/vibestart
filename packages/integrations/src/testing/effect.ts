import type { Context } from "@vibestart/core";
import { contribute, file, packageJson } from "@vibestart/core";

import { databaseName } from "#/app.ts";
import { replaceOnce, templateContent, templateFiles } from "#/templates.ts";
import { ultracitePresets } from "#/ultracite.ts";
import {
  agentsSections,
  readmeCommandNotes,
  readySteps,
  testProjects,
} from "#/vite-plus/slots.ts";

import agentsTestsIntro from "./agents-tests-intro.md?raw";
import { publicTestApp } from "./effect-app.ts";
import type { BrowserRunner } from "./runners.ts";

const server = (ctx: Context) => {
  const path = "apps/web/tests/support/server.ts";
  let source = templateContent(ctx, "testing/effect", path);

  if (!ctx.has("better-auth")) {
    source = replaceOnce(
      source,
      '    BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters",\n    BETTER_AUTH_URL: e2eBaseURL,',
      "    APP_URL: e2eBaseURL,",
      path
    );
    source = replaceOnce(
      source,
      '["/", "/login", "/todos"]',
      ctx.stack.database === undefined ? '["/"]' : '["/", "/todos"]',
      path
    );
  }

  if (ctx.stack.database === undefined) {
    for (const [from, to] of [
      ["Effect, Redacted, Schedule", "Effect, Schedule"],
      [`import { makeTestDatabase } from "${ctx.scope}/db/testing";\n`, ""],
      ["  const databaseUrl = yield* makeTestDatabase;\n", ""],
      ["    DATABASE_URL: Redacted.value(databaseUrl),\n", ""],
    ] as const) {
      source = replaceOnce(source, from, to, path);
    }
  }

  return file(path, source);
};

const integrationTests = (ctx: Context) => {
  const variant = ctx.stack.database === undefined ? "health" : "public";

  const set = ctx.has("better-auth")
    ? "testing/effect-auth"
    : `testing/effect-${variant}`;

  const path = "packages/api/tests/integration/todos.test.ts";

  return [
    ...templateFiles(ctx, set, {
      except: ctx.has("sqlite") && ctx.has("better-auth") ? [path] : [],
    }),
    ...(ctx.has("sqlite") && ctx.has("better-auth")
      ? [
          file(
            path,
            templateContent(ctx, set, path).replaceAll(".execute(", ".run(")
          ),
        ]
      : []),
  ];
};

const testGuide = (ctx: Context, runner: BrowserRunner) =>
  [
    agentsTestsIntro.trimEnd(),
    `${runner.name} drives Chromium against the real Effect server and Vite on :3200 (\`E2E_TEST_PORT\`). ${ctx.stack.database === undefined ? "No database or authentication service is required." : `Each run creates and migrates its own ${databaseName(ctx)} database and removes it when the scope closes.`} ${ctx.has("postgres") ? "Tests need PostgreSQL running at DATABASE_URL from apps/server/.env." : ""}`,
    "Integration tests use `@effect/vitest` and `HttpRouter.toWebHandler` to exercise real routes in process, without a port. Each test file owns its scoped services. Raw NDJSON requests exercise server-side schema validation.",
    ...runner.practice,
    "E2E tests in `apps/web/tests/e2e` are the specification: changing, skipping, or weakening an assertion takes the user's approval first.",
    `While iterating, run \`vp test --project unit\`, \`vp test --project integration\`, \`vp test --changed\`, or \`vp exec ${runner.command} <file>\` in \`apps/web\`.`,
  ].join("\n\n");

export const effectTesting = (ctx: Context, runner: BrowserRunner) => [
  ...runner.contribute(ctx),
  ...(ctx.has("playwright")
    ? templateFiles(ctx, "testing/effect-playwright")
    : templateFiles(ctx, "testing/effect-start")),
  server(ctx),
  ...(ctx.stack.database === undefined
    ? []
    : [
        ...templateFiles(
          ctx,
          ctx.has("sqlite")
            ? "testing/effect-sqlite"
            : "testing/effect-postgres"
        ),
        ...(ctx.has("postgres") ? templateFiles(ctx, "testing/database") : []),
      ]),
  ...integrationTests(ctx),
  ...(ctx.has("better-auth") ? [] : [publicTestApp(ctx)]),
  ...templateFiles(
    ctx,
    ctx.has("better-auth")
      ? `testing/effect-${ctx.stack.testing}-auth`
      : `${runner.templates}/${ctx.stack.database === undefined ? "health" : "public"}`
  ),
  contribute(packageJson, {
    path: "apps/web",
    devDependencies: [
      ...runner.devDependencies,
      "@effect/platform-node",
      ...(ctx.stack.database === undefined ? [] : [`${ctx.scope}/db`]),
    ],
    scripts: { "test:e2e": runner.command },
  }),
  contribute(packageJson, {
    path: "packages/api",
    devDependencies: ["@effect/vitest", "vitest"],
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
    description: `end-to-end tests (${runner.name}) against the real Effect server${ctx.stack.database === undefined ? "" : ` and ${databaseName(ctx)}`}`,
    label: "test:e2e",
    phase: "verify",
  }),
  contribute(ultracitePresets, {
    module: "ultracite/oxlint/vitest",
    name: "vitest",
  }),
  contribute(agentsSections, testGuide(ctx, runner)),
  contribute(
    readmeCommandNotes,
    `The first \`vp run test:e2e\` needs Chromium: \`cd apps/web && vp exec ${runner.installer} install chromium\`.`
  ),
];
