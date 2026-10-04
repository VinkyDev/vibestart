import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
} from "@vibestart/core";

import {
  authVariant,
  databaseName,
  exampleVariant,
  hasBackend,
  hasWebApp,
  serverApp,
  todosExample,
} from "#/app.ts";
import { joinWords, markdownTable } from "#/format.ts";
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
import { renderTestServer } from "./server.ts";

const apiStyle = (ctx: Context) => (ctx.has("openapi") ? "openapi" : "orpc");

// The todo example is the behavior an integration test pins. A health check alone is covered by the e2e tests and the build.
const hasIntegrationTests = todosExample;

// The todos example, accounts alone, a server's health, or the pages alone.
const e2eVariant = (ctx: Context) => {
  const example = exampleVariant(ctx);
  if (example !== "none") {
    return example;
  }
  return hasBackend(ctx) ? "health" : "home";
};

const usesTestDatabase = (ctx: Context) =>
  ctx.stack.database !== undefined &&
  (hasWebApp(ctx) || hasIntegrationTests(ctx));

const e2eServers = (ctx: Context) => {
  if (!hasBackend(ctx)) {
    return "the dev server";
  }
  if (ctx.stack.database === undefined) {
    return "the real web app and API server";
  }
  return ctx.has("hono")
    ? `the real web app, API, and ${databaseName(ctx)}`
    : `the real server and ${databaseName(ctx)}`;
};

const integrationRow = (ctx: Context) => {
  const sessions = ctx.has("better-auth") ? "real sessions, " : "";
  const authorization = ctx.has("better-auth") ? "authorization, " : "";
  return ctx.has("openapi")
    ? [
        "Integration",
        "`packages/api/tests/integration/*.test.ts`",
        `Vitest sending requests to \`createApi\` in process through the typed \`hono/client\`, ${sessions}a real ${databaseName(ctx)} database`,
        `Every route's validation, status codes, ${authorization}and response bodies`,
      ]
    : [
        "Integration",
        "`packages/api/tests/integration/*.test.ts`",
        `Vitest calling \`appRouter\` in process through \`createRouterClient\`, ${sessions}a real ${databaseName(ctx)} database`,
        `Every procedure's validation, error codes, ${authorization}and invariants`,
      ];
};

const layerTable = (ctx: Context) =>
  markdownTable(
    ["Layer", "Location", "Runs against", "Write it for"],
    [
      ...(hasWebApp(ctx)
        ? [
            [
              "End-to-end",
              "`apps/web/tests/e2e/*.e2e.ts`",
              `Playwright driving Chromium against ${e2eServers(ctx)}`,
              "Journeys that decide whether the product works",
            ],
          ]
        : []),
      ...(hasIntegrationTests(ctx) ? [integrationRow(ctx)] : []),
      [
        "Unit",
        `\`*.test.ts\` beside the code in \`${ctx.has("hono") ? "apps/server/src" : "apps/web/src"}\` or \`packages/*/src\``,
        "Node, no I/O",
        "Branching logic: pricing, permissions, state machines, parsers, calculations, edge cases",
      ],
    ]
  );

const frontServer = (ctx: Context) => {
  if (ctx.has("next")) {
    return "`next dev` in its own `.next-test-<port>`, beside any running dev server";
  }
  return ctx.has("spa") && ctx.has("hono") ? "Vite" : "`vp dev`";
};

const e2eStack = (ctx: Context) => {
  const parts = [
    ...(ctx.stack.database === undefined
      ? []
      : [
          ctx.has("sqlite")
            ? "a fresh SQLite file"
            : "a fresh PostgreSQL database",
        ]),
    ...(ctx.has("hono") ? ["the real Hono server"] : []),
  ];
  return ctx.has("hono")
    ? `${joinWords([...parts, `${frontServer(ctx)} in front`])}, with the same proxy and origin as development`
    : joinWords([...parts, frontServer(ctx)]);
};

const isolationSentences = (ctx: Context) => [
  ...(hasWebApp(ctx)
    ? [
        `\`apps/web/tests/support/server.ts\` starts the stack for the e2e tests on :3200 (\`E2E_TEST_PORT\`): ${e2eStack(ctx)}. A second checkout runs its tests at the same time on another port.`,
      ]
    : []),
  ...(hasIntegrationTests(ctx)
    ? [
        `Each integration test file gets a database of its own from \`createTestDatabase()\` in \`${ctx.scope}/db/testing\`, migrated and removed when the file ends, so files run in parallel.`,
      ]
    : []),
  ...(usesTestDatabase(ctx)
    ? [
        ctx.has("postgres")
          ? `Test databases are created beside \`DATABASE_URL\` from \`${serverApp(ctx).dir}/.env\`, so the tests need PostgreSQL running.`
          : "Test databases are SQLite files in the system temp directory with the real migrations applied.",
        ctx.has("better-auth")
          ? "Tests sign up a new user with `signUp()`, so they share no rows."
          : "Tests create the rows they read and do not depend on each other's rows.",
      ]
    : []),
];

// One paragraph, or none for a project whose tests touch no server or database.
const isolation = (ctx: Context) => {
  const sentences = isolationSentences(ctx);
  return sentences.length === 0 ? [] : [sentences.join(" ")];
};

const practice = (ctx: Context) => {
  const web = hasWebApp(ctx);
  return [
    ...(web
      ? [
          'Open and reload pages with `visit()` (`waitUntil: "networkidle"`) before clicking. Server-rendered pages hydrate after load, and a click before hydration does nothing. Assert with Playwright\'s web-first assertions (`toBeVisible`, `toHaveURL`, `toBeChecked`).',
        ]
      : []),
    ...(hasIntegrationTests(ctx)
      ? [
          `Integration tests ${ctx.has("openapi") ? "send requests to `createApi` in this process, through the same routing and validation as the server" : "call the procedures in this process, through the same middleware and validation as a request"}, with ${ctx.has("better-auth") ? "real Better Auth sessions and " : ""}a real database; nothing of this repo is mocked. A fake stands in only for a third-party service this repo does not run, with the reason next to it and a contract test that pins the request and response it imitates.`,
        ]
      : []),
    [
      "A test fails when the behavior it names is broken. For important logic, break the code on purpose and confirm a test fails. A bug fix starts from a test that reproduces the bug and fails.",
      ...(web
        ? [
            "E2E tests in `apps/web/tests/e2e` are the specification: changing, skipping, or weakening an assertion takes the user's approval first.",
          ]
        : []),
    ].join(" "),
    `While iterating, run the narrowest set that covers the change: ${[
      "`vp test --project unit`",
      ...(hasIntegrationTests(ctx) ? ["`vp test --project integration`"] : []),
      "`vp test --changed`",
      web
        ? "a single file, or `vp exec playwright test <file>` in `apps/web`"
        : "or a single file",
    ].join(", ")}.`,
  ];
};

const coverage = (ctx: Context) => {
  const layers = [
    ...(hasIntegrationTests(ctx) ? ["integration"] : []),
    ...(hasWebApp(ctx) ? ["e2e"] : []),
  ];
  return layers.length === 0
    ? []
    : [
        `A module with no branching logic worth isolating is covered by its ${layers.join(" or ")} test.`,
      ];
};

const renderTestsSection = (ctx: Context) =>
  [
    agentsTestsIntro.trimEnd(),
    layerTable(ctx),
    ...coverage(ctx),
    ...isolation(ctx),
    ...practice(ctx),
  ].join("\n\n");

const e2e = (ctx: Context) => {
  const variant = e2eVariant(ctx);
  return [
    file("apps/web/tests/support/server.ts", renderTestServer(ctx)),
    ...templateFiles(ctx, "vitest-playwright/e2e"),
    ...templateFiles(ctx, `vitest-playwright/e2e-${variant}`),
    ...(variant === "auth"
      ? templateFiles(ctx, `vitest-playwright/e2e-auth-${apiStyle(ctx)}`)
      : []),
    ...(hasBackend(ctx)
      ? templateFiles(ctx, "vitest-playwright/e2e-http")
      : []),
    contribute(packageJson, {
      devDependencies: [
        "@playwright/test",
        "es-toolkit",
        ...(hasBackend(ctx) ? ["undici"] : []),
        ...(ctx.stack.database === undefined ? [] : [`${ctx.scope}/db`]),
      ],
      path: "apps/web",
      scripts: { "test:e2e": "playwright test" },
    }),
    contribute(packageJson, {
      path: ".",
      scripts: { "test:e2e": `vp run --filter ${ctx.scope}/web test:e2e` },
    }),
    contribute(readySteps, {
      command: "vp run test:e2e",
      description: `e2e tests (Playwright) in Chromium, against ${ctx.stack.database === undefined ? "the dev server" : "a real server and database"}`,
      label: "test:e2e",
      phase: "verify",
    }),
    contribute(ignoredFiles, "playwright-report"),
    contribute(ignoredFiles, "test-results"),
    contribute(
      readmeCommandNotes,
      "The first `vp run test:e2e` needs a browser: `cd apps/web && vp exec playwright install chromium`."
    ),
  ];
};

const integration = (ctx: Context) => [
  ...templateFiles(
    ctx,
    `vitest-playwright/integration-${apiStyle(ctx)}-${authVariant(ctx)}`
  ),
  contribute(testProjects, {
    // The tests read the server's `.env` as the server does; PostgreSQL creates test databases beside its `DATABASE_URL`.
    envDir: serverApp(ctx).dir,
    include: "packages/api/tests/integration/**/*.test.ts",
    name: "integration",
  }),
];

export const vitestPlaywright = defineIntegration({
  contribute: (ctx) => [
    ...(usesTestDatabase(ctx)
      ? [
          ...templateFiles(
            ctx,
            `vitest-playwright/database-${ctx.has("sqlite") ? "sqlite" : "postgres"}`
          ),
          contribute(packageJson, {
            exports: { "./testing": "./src/testing.ts" },
            path: "packages/db",
          }),
        ]
      : []),
    ...(hasWebApp(ctx) ? e2e(ctx) : []),
    ...(hasIntegrationTests(ctx) ? integration(ctx) : []),
    contribute(ultracitePresets, {
      module: "ultracite/oxlint/vitest",
      name: "vitest",
    }),
    contribute(agentsSections, renderTestsSection(ctx)),
  ],
  id: "vitest-playwright",
  kind: "testing",
  name: "Vitest + Playwright",
  description: "API integration tests and browser end-to-end tests",
  homepage: "https://vitest.dev",
});
