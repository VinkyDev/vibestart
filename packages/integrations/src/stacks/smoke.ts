import { execSync } from "node:child_process";
import { closeSync, openSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { Generation, Stack } from "@vibestart/core";

import httpSmoke from "../../templates/testing/http-smoke/http-smoke.mjs.txt?raw";
import {
  print,
  projectEnv,
  serverUrls,
  writeEnvFiles,
  writeProject,
} from "./project.ts";

// What the generated `migrate.ts` closes `db` with, for the stack's ORM and driver.
const closeStatement = ({ database, orm }: Stack) => {
  if (orm === "prisma") {
    return "await db.$disconnect();";
  }

  if (orm === "mongoose") {
    return "await db.connection.close();";
  }

  if (database === "sqlite") {
    return "db.$client.close();";
  }

  return database === "mysql"
    ? "await db.$client.promise().end();"
    : "await db.$client.end();";
};

export const smokeStack = ({
  generation,
  label,
  out,
  stack,
}: {
  generation: Generation;
  label: string;
  out: string;
  stack: Stack;
}) => {
  const dir = path.join(out, label);
  writeProject(dir, generation);
  writeEnvFiles(dir, generation);
  const logFile = `${dir}.smoke.log`;
  const log = openSync(logFile, "w");
  const { database } = stack;
  const server = database !== undefined && database !== "sqlite";

  const script = [
    'import assert from "node:assert/strict";',
    'const { app } = await import("./apps/server/src/app.ts");',
    ...(database === undefined
      ? []
      : ['const { db } = await import("./apps/server/src/context.ts");']),
    "try {",
    '  assert.equal(typeof app.fetch, "function");',
    ...(database === "sqlite"
      ? [
          '  const { migrateDatabase } = await import("./packages/db/src/migrate.ts");',
          "  await migrateDatabase(db);",
        ]
      : []),
    ...(server
      ? []
      : [
          '  const response = await app.request("http://localhost/api/health");',
          "  assert.equal(response.status, 200);",
          '  assert.equal((await response.json()).status, "ok");',
        ]),
    ...(stack.api === "openapi"
      ? [
          '  const schema = await app.request("http://localhost/api/openapi.json");',
          "  assert.equal(schema.status, 200);",
          '  assert.equal(typeof (await schema.json()).openapi, "string");',
        ]
      : []),
    ...(database === "sqlite" && stack.auth === "better-auth"
      ? [
          `  const email = \`smoke-\${crypto.randomUUID()}@example.com\`;`,
          '  const signUp = await app.request("http://localhost:3000/api/auth/sign-up/email", {',
          '    method: "POST",',
          '    headers: { "Content-Type": "application/json", Origin: "http://localhost:3000" },',
          '    body: JSON.stringify({ name: "Smoke", email, password: "test-password-that-is-not-a-secret" }),',
          "  });",
          "  assert.equal(signUp.status, 200);",
          '  const cookie = signUp.headers.get("set-cookie")?.split(";")[0];',
          "  assert.ok(cookie);",
          '  const session = await app.request("http://localhost:3000/api/auth/get-session", { headers: { Cookie: cookie } });',
          "  assert.equal(session.status, 200);",
          "  assert.equal((await session.json()).user.email, email);",
        ]
      : []),
    "} finally {",
    ...(database === undefined ? [] : [`  ${closeStatement(stack)}`]),
    "}",
    server
      ? 'console.log("Runtime imports passed; live database requests require stacks verify.");'
      : 'console.log("Runtime imports and in-memory Hono requests passed; no server started.");',
  ].join("\n");

  const runtime = stack.runtime === "bun" ? "bun" : "node";

  const commands = [
    "git init -q",
    ...generation.setup.map((command) => command.run),
    "vp check",
    "vp run knip",
    "vp test --project unit --passWithNoTests",
    "vp run build",
  ];

  const env = {
    ...projectEnv,
    DATABASE_URL:
      database === "sqlite"
        ? path.join(dir, "runtime-smoke.sqlite")
        : serverUrls[
            database === "mysql" || database === "mongodb"
              ? database
              : "postgres"
          ],
    BETTER_AUTH_SECRET: "smoke-secret-that-is-at-least-32-characters",
    BETTER_AUTH_URL: "http://localhost:3000",
  };

  let passed = true;

  try {
    for (const command of commands) {
      execSync(command, { cwd: dir, env, stdio: ["ignore", log, log] });
    }

    // Write the transient probe only after project lint and Knip; it is not application source.
    writeFileSync(path.join(dir, "runtime-smoke.mjs"), script);

    // Only the e2e support of a web app installs the fixed Undici dispatcher.
    if (stack.framework !== undefined) {
      writeFileSync(path.join(dir, "http-smoke.mjs"), httpSmoke);
      execSync("node http-smoke.mjs", {
        cwd: dir,
        env,
        stdio: ["ignore", log, log],
      });
    }

    execSync(`${runtime} runtime-smoke.mjs`, {
      cwd: dir,
      env,
      stdio: ["ignore", log, log],
    });
  } catch {
    passed = false;
  } finally {
    closeSync(log);
  }

  print(`${label} smoke ${passed ? "PASS" : "FAIL"}, see ${logFile}`);

  return passed;
};
