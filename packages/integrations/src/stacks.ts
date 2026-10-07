import { execSync } from "node:child_process";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

import type { Generation, PackageManager, Stack } from "@vibestart/core";
import { legalStacks } from "@vibestart/core";

import { verificationCommand } from "#/ci/main.ts";
import {
  generateProject,
  writeProject,
  writeEnvFiles,
  projectEnv,
  postgresUrl,
} from "#/ci/project.ts";
import { goldenPaths, goldenRoot, goldens } from "#/goldens.ts";
import { registry } from "#/registry.ts";
import { repoRoot } from "#/repo.ts";
import { stackLabel } from "#/stack-label.ts";
import { bunSubjects, verifiedStacks } from "#/verification.ts";

import httpSmoke from "../templates/testing/http-smoke/http-smoke.mjs.txt?raw";

const print = (line: string) => {
  process.stdout.write(`${line}\n`);
};

interface StackRun {
  generation: Generation;
  label: string;
  stack: Stack;
  out: string;
}

const smokeStack = ({
  generation,
  label,
  out,
  stack,
}: Pick<StackRun, "generation" | "label" | "out" | "stack">) => {
  const dir = path.join(out, label);
  writeProject(dir, generation);
  writeEnvFiles(dir);
  const logFile = `${dir}.smoke.log`;
  const log = openSync(logFile, "w");
  const { database } = stack;
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
    ...(database === "postgres"
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
    ...(database === "sqlite" ? ["  db.$client.close();"] : []),
    ...(database === "postgres" ? ["  await db.$client.end();"] : []),
    "}",
    database === "postgres"
      ? 'console.log("Runtime imports passed; live PostgreSQL requests require stacks verify.");'
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
        : postgresUrl,
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

/** A new golden runs its setup; a golden no longer listed is deleted. */
const syncGoldens = async () => {
  for (const stale of readdirSync(`${repoRoot}golden`).filter(
    (golden) => !Object.hasOwn(goldens, golden)
  )) {
    rmSync(goldenRoot(stale), { force: true, recursive: true });
    print(`deleted golden/${stale}`);
  }
  await Promise.all(
    Object.entries(goldens).map(async ([golden, stack]) => {
      const generation = await generateProject(stack);
      const root = goldenRoot(golden);
      const created = !existsSync(root);
      const setupWrites = generation.setup.flatMap((command) => command.writes);
      const generated = new Set(generation.files.map((file) => file.path));
      for (const stale of created
        ? []
        : goldenPaths(golden).filter(
            (file) =>
              !generated.has(file) &&
              !setupWrites.some((glob) => path.matchesGlob(file, glob))
          )) {
        rmSync(`${root}${stale}`);
        print(`${golden}: deleted ${stale}`);
      }
      for (const file of generation.files) {
        mkdirSync(path.dirname(`${root}${file.path}`), { recursive: true });
        writeFileSync(`${root}${file.path}`, file.content);
      }
      if (created) {
        for (const command of generation.setup) {
          print(`${golden}: ${command.run}`);
          // A golden sits inside this repository, so its `vp config` must not take over the repository's hooks.
          execSync(command.run, {
            cwd: root,
            env: { ...projectEnv, VP_GIT_HOOKS: "0" },
            stdio: "inherit",
          });
        }
      }
    })
  );
};

const verifiedLabels = [
  ...verifiedStacks.map((stack) => stackLabel(stack)),
  ...bunSubjects.map((stack) => `${stackLabel(stack)}-bun-pm`),
].toSorted();

const shardOf = (label: string, shards: number) =>
  verifiedLabels.indexOf(label) % shards;

const shardPattern = /^(?<index>\d+)\/(?<count>\d+)$/u;

const usage = `Usage: vp run stacks <command> [pattern] [options]

  gen [pattern]     generate legal stacks (--out, --package-manager, --shard)
  smoke [pattern]   run Hono checks without listening (--out, --package-manager)
  goldens           regenerate checked-in golden projects
  restore           download recent same-repository CI evidence with gh
  plan              plan missing Linux subjects and Windows goldens (--force)
  run <batch>       execute one planned batch
  report            require every planned result and embed the matching report
  check             require a complete, current report without executing projects
  verify [pattern]  verify matching subjects on this machine (--force)

CI evidence, locks, generated output and logs live in .verification/ (ignored).
Verification needs PostgreSQL at STACKS_POSTGRES_URL, Chromium and Bun.`;

interface Selection {
  command: string;
  managers: readonly PackageManager[];
  matching: RegExp | undefined;
  shard: { count: number; index: number };
}

const selectStacks = async ({
  command,
  managers,
  matching,
  shard,
}: Selection) => {
  // A stack another one is verified as needs no run of its own, and Bun installs only the subjects.
  const stacksFor = () => {
    if (command === "gen") {
      return legalStacks(registry);
    }
    return verifiedStacks;
  };
  return await Promise.all(
    managers
      .flatMap((packageManager) =>
        stacksFor().map((stack) => ({
          stack,
          packageManager,
          label: `${stackLabel(stack)}${packageManager === "bun" ? "-bun-pm" : ""}`,
        }))
      )
      .filter(({ stack }) => command !== "smoke" || stack.backend === "hono")
      .filter(({ label }) => shardOf(label, shard.count) === shard.index)
      .filter(({ label }) => matching === undefined || matching.test(label))
      .map(async ({ stack, packageManager, label }) => ({
        generation: await generateProject(stack, packageManager),
        label,
        stack,
      }))
  );
};

interface Options {
  out: string;
  "package-manager": string;
  shard: string;
}

const runStackCommand = async (
  command: string,
  pattern: string | undefined,
  values: Options
) => {
  const parsedShard = shardPattern.exec(values.shard)?.groups;
  const shard = {
    count: Number(parsedShard?.count),
    index: Number(parsedShard?.index),
  };
  if (parsedShard === undefined || shard.index >= shard.count) {
    print("--shard is <i>/<n> with 0 <= i < n");
    return 1;
  }
  const requested = values["package-manager"];
  if (requested !== "pnpm" && requested !== "bun" && requested !== "all") {
    print("--package-manager is pnpm, bun, or all");
    return 1;
  }
  const selected = await selectStacks({
    command,
    managers: requested === "all" ? ["pnpm", "bun"] : [requested],
    matching: pattern === undefined ? undefined : new RegExp(pattern, "u"),
    shard,
  });
  mkdirSync(values.out, { recursive: true });
  if (command === "gen") {
    for (const { generation, label } of selected) {
      writeProject(path.join(values.out, label), generation);
    }
    print(`${selected.length} stacks in ${values.out}`);
    return 0;
  }
  if (command === "smoke") {
    const results = selected.map(({ generation, label, stack }) =>
      smokeStack({ generation, label, stack, out: values.out })
    );
    return results.every(Boolean) ? 0 : 1;
  }
  return 1;
};

export const main = async (args: readonly string[]) => {
  if (
    ["plan", "run", "report", "restore", "check", "verify"].includes(
      args[0] ?? ""
    )
  ) {
    return await verificationCommand(args);
  }
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: [...args],
    options: {
      "package-manager": { default: "all", type: "string" },
      out: { default: path.join(tmpdir(), "vibestart-stacks"), type: "string" },
      shard: { default: "0/1", type: "string" },
    },
  });
  const [command = "", pattern] = positionals;
  if (command === "goldens") {
    await syncGoldens();
    return 0;
  }
  if (["gen", "smoke"].includes(command)) {
    return await runStackCommand(command, pattern, values);
  }
  print(usage);
  return command === "" ? 0 : 1;
};
