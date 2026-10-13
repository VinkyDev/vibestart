import type { Context, Contribution } from "@vibestart/core";
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
  chosenDatabase,
  todosExample,
  ormId,
} from "#/app.ts";
import { joinWords, markdownTable } from "#/format.ts";
import { templateContent, templateFiles } from "#/templates.ts";
import { ultracitePresets } from "#/ultracite.ts";
import {
  agentsSections,
  readmeCommandNotes,
  readySteps,
  testProjects,
} from "#/vite-plus/slots.ts";

import agentsTestsIntro from "./agents-tests-intro.md?raw";
import type { BrowserRunner } from "./runners.ts";
import { e2e, playwright } from "./runners.ts";
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

// These servers cap a database name, so their test database names are bounded.
const sqlServerIds = new Set(["mysql", "postgres"]);

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

const unitSources = (ctx: Context) => [
  ...(ctx.has("hono") ? ["apps/server/src"] : []),
  ...(!ctx.has("hono") && hasWebApp(ctx) ? ["apps/web/src"] : []),
  ...(ctx.has("expo") ? ["apps/mobile/src"] : []),
];

const layerTable = (ctx: Context, runner: BrowserRunner) =>
  markdownTable(
    ["Layer", "Location", "Runs against", "Write it for"],
    [
      ...(hasWebApp(ctx)
        ? [
            [
              "End-to-end",
              "`apps/web/tests/e2e/*.e2e.ts`",
              `${runner.name} driving Chromium against ${e2eServers(ctx)}`,
              "Journeys that decide whether the product works",
            ],
          ]
        : []),
      ...(hasIntegrationTests(ctx) ? [integrationRow(ctx)] : []),
      [
        "Unit",
        `\`*.test.ts\` beside the code in ${unitSources(ctx)
          .map((source) => `\`${source}\``)
          .join(", ")} or \`packages/*/src\``,
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
            : `a fresh ${databaseName(ctx)} database`,
        ]),
    ...(ctx.has("hono") ? ["the real Hono server"] : []),
  ];
  return ctx.has("hono")
    ? `${joinWords([...parts, `${frontServer(ctx)} in front`])}, with the same proxy and origin as development`
    : joinWords([...parts, frontServer(ctx)]);
};

const isolationSentences = (ctx: Context, runner: BrowserRunner) => [
  ...(hasWebApp(ctx)
    ? [
        `${runner.startsStack} the stack for the e2e tests on :3200 (\`E2E_TEST_PORT\`): ${e2eStack(ctx)}. A second checkout runs its tests at the same time on another port.`,
      ]
    : []),
  ...(hasIntegrationTests(ctx)
    ? [
        `Each integration test file gets a database of its own from \`createTestDatabase()\` in \`${ctx.scope}/db/testing\`, migrated and removed when the file ends, so files run in parallel.`,
      ]
    : []),
  ...(usesTestDatabase(ctx)
    ? [
        chosenDatabase(ctx).server
          ? `Test databases are created beside \`DATABASE_URL\` from \`${serverApp(ctx).dir}/.env\`, so the tests need ${databaseName(ctx)} running.`
          : "Test databases are SQLite files in the system temp directory with the real migrations applied.",
        ctx.has("better-auth")
          ? "Tests sign up a new user with `signUp()`, so they share no rows."
          : "Tests create the rows they read and do not depend on each other's rows.",
      ]
    : []),
];

// One paragraph, or none for a project whose tests touch no server or database.
const isolation = (ctx: Context, runner: BrowserRunner) => {
  const sentences = isolationSentences(ctx, runner);
  return sentences.length === 0 ? [] : [sentences.join(" ")];
};

const practice = (ctx: Context, runner: BrowserRunner) => {
  const web = hasWebApp(ctx);
  return [
    ...(web ? runner.practice : []),
    ...(hasIntegrationTests(ctx)
      ? [
          `Integration tests ${ctx.has("openapi") ? "send requests to `createApi` in this process, through the same routing and validation as the server" : "call the procedures in this process, through the same middleware and validation as a request"}, with ${ctx.has("better-auth") ? "real Better Auth sessions and " : ""}a real database.`,
        ]
      : []),
    ...(web
      ? [
          "E2E tests in `apps/web/tests/e2e` are the specification: changing, skipping, or weakening an assertion takes the user's approval first.",
        ]
      : []),
    `While iterating, run the narrowest set that covers the change: ${[
      "`vp test --project unit`",
      ...(hasIntegrationTests(ctx) ? ["`vp test --project integration`"] : []),
      "`vp test --changed`",
      web
        ? `a single file, or \`vp exec ${runner.command} <file>\` in \`apps/web\``
        : "or a single file",
    ].join(", ")}.`,
  ];
};

const renderTestsSection = (ctx: Context, runner: BrowserRunner) =>
  [
    agentsTestsIntro.trimEnd(),
    layerTable(ctx, runner),
    ...isolation(ctx, runner),
    ...practice(ctx, runner),
  ].join("\n\n");

const support = (ctx: Context) => {
  const variant = e2eVariant(ctx);
  return [
    file("apps/web/tests/support/server.ts", renderTestServer(ctx)),
    ...(variant === "account"
      ? templateFiles(ctx, "testing/support/account")
      : []),
    ...(variant === "auth"
      ? templateFiles(ctx, `testing/support/auth-${apiStyle(ctx)}`)
      : []),
    ...(hasBackend(ctx) ? templateFiles(ctx, "testing/support/http") : []),
  ];
};

const browserTests = (ctx: Context, runner: BrowserRunner) => [
  ...support(ctx),
  ...templateFiles(ctx, `${runner.templates}/${e2eVariant(ctx)}`),
  contribute(
    readmeCommandNotes,
    `The first \`vp run test:e2e\` needs a browser: \`cd apps/web && vp exec ${runner.installer} install chromium\`.`
  ),
  ...runner.contribute(ctx),
  contribute(packageJson, {
    devDependencies: [
      ...runner.devDependencies,
      "es-toolkit",
      ...(hasBackend(ctx) ? ["undici"] : []),
      ...(ctx.stack.database === undefined ? [] : [`${ctx.scope}/db`]),
    ],
    path: "apps/web",
    scripts: { "test:e2e": runner.command },
  }),
  contribute(packageJson, {
    path: ".",
    scripts: { "test:e2e": `vp run --filter ${ctx.scope}/web test:e2e` },
  }),
  contribute(readySteps, {
    command: "vp run test:e2e",
    description: `end-to-end tests (${runner.name}) in Chromium, against ${ctx.stack.database === undefined ? "the dev server" : "a real server and database"}`,
    label: "test:e2e",
    phase: "verify",
  }),
];

const todosTestPath = "packages/api/tests/integration/todos.test.ts";

// An anonymous caller names some todo; on MongoDB that is an ObjectId.
const anonymousTodosTest = (ctx: Context, set: string) => {
  const content = templateContent(ctx, set, todosTestPath);
  const named = content.replaceAll(
    "id: 1 }",
    'id: "0123456789abcdef01234567" }'
  );
  if (named === content) {
    throw new Error(`${set}/${todosTestPath} names no todo id 1`);
  }
  return file(todosTestPath, named);
};

// An OpenAPI path carries a todo's ObjectId as the string it already is.
const stringIdTodosTest = (ctx: Context, set: string) => {
  const content = templateContent(ctx, set, todosTestPath);
  const passed = content.replaceAll("String(todo.id)", "todo.id");
  if (passed === content) {
    throw new Error(`${set}/${todosTestPath} converts no todo id`);
  }
  return file(todosTestPath, passed);
};

const mongodbTodosTest = (ctx: Context, set: string) => {
  if (ctx.has("openapi")) {
    return stringIdTodosTest(ctx, set);
  }
  return ctx.has("better-auth") ? anonymousTodosTest(ctx, set) : undefined;
};

const integrationTestFiles = (ctx: Context) => {
  const set = `testing/integration/${apiStyle(ctx)}-${authVariant(ctx)}`;
  const todosTest = ctx.has("mongodb") ? mongodbTodosTest(ctx, set) : undefined;
  return todosTest
    ? [...templateFiles(ctx, set, { except: [todosTestPath] }), todosTest]
    : templateFiles(ctx, set);
};

const integrationTests = (ctx: Context) => [
  ...integrationTestFiles(ctx),
  contribute(testProjects, {
    // The tests read the server's `.env` as the server does; PostgreSQL creates test databases beside its `DATABASE_URL`.
    envDir: serverApp(ctx).dir,
    include: "packages/api/tests/integration/**/*.test.ts",
    name: "integration",
  }),
];

const testing = (ctx: Context, runner: BrowserRunner): Contribution[] => [
  ...(usesTestDatabase(ctx)
    ? [
        ...templateFiles(
          ctx,
          `${ormId(ctx)}/${chosenDatabase(ctx).id}/testing`
        ),
        ...(sqlServerIds.has(chosenDatabase(ctx).id)
          ? templateFiles(ctx, `testing/database/${chosenDatabase(ctx).id}`)
          : []),
        contribute(packageJson, {
          exports: { "./testing": "./src/testing.ts" },
          path: "packages/db",
        }),
      ]
    : []),
  ...(hasWebApp(ctx) ? browserTests(ctx, runner) : []),
  ...(hasIntegrationTests(ctx) ? integrationTests(ctx) : []),
  contribute(ultracitePresets, {
    module: "ultracite/oxlint/vitest",
    name: "vitest",
  }),
  contribute(agentsSections, renderTestsSection(ctx, runner)),
];

export const playwrightTests = defineIntegration({
  contribute: (ctx) => testing(ctx, playwright),
  kind: "testing",
  description:
    "Control actions and assertions in code, wait automatically for elements, and inspect each step in a trace. Fits clear acceptance criteria and regression suites maintained over time.",
  formerIds: ["vitest-playwright"],
  homepage: "https://playwright.dev",
  id: "playwright",
  name: "Playwright",
});

export const e2eTests = defineIntegration({
  contribute: (ctx) => testing(ctx, e2e),
  kind: "testing",
  description:
    "Mix natural-language goals with scripted assertions. An AI agent explores the UI, and verified actions can replay from cache. Fits evolving interfaces and teams adding user-journey coverage quickly.",
  formerIds: ["vitest-e2e"],
  homepage: "https://e2e.tester.army",
  id: "e2e",
  name: "TesterArmy e2e",
  requires: ["frontend-framework"],
});
