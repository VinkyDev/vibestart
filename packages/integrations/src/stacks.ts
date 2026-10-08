import { execSync, spawn } from "node:child_process";
import { once } from "node:events";
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {
  arch,
  availableParallelism,
  platform,
  release,
  tmpdir,
  userInfo,
} from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

import { limitAsync } from "es-toolkit/promise";

import type { Generation, PackageManager, Stack } from "@vibestart/core";
import { fingerprint, generate, legalStacks } from "@vibestart/core";

import { downloadEvidence } from "#/evidence.ts";
import { goldenPaths, goldenRoot, goldens } from "#/goldens.ts";
import { formatWithProjectConfig } from "#/oxfmt.ts";
import { registry } from "#/registry.ts";
import { repoRoot } from "#/repo.ts";
import { materializeEnvFromExamples } from "#/server-env.ts";
import { stackLabel } from "#/stack-label.ts";
import { e2e, playwright } from "#/testing/runners.ts";
import type { StackVerification, Task } from "#/verification-store.ts";
import {
  batchesOf,
  cloneStore,
  currentRecords,
  generateTask,
  projectionOf,
  readRecords,
  tasks,
  writeRecords,
} from "#/verification-store.ts";
import type { Platform } from "#/verification.ts";
import {
  platforms,
  verification,
  verifiedBlueprint,
  verifiedName,
  verifiedStacks,
} from "#/verification.ts";

import httpSmoke from "../templates/testing/http-smoke/http-smoke.mjs.txt?raw";

const generateProject = async (stack: Stack, packageManager?: PackageManager) =>
  await generate(registry, verifiedBlueprint(stack, packageManager), {
    name: verifiedName,
  });

const writeProject = (dir: string, { files }: Generation) => {
  rmSync(dir, { force: true, recursive: true });
  for (const file of files) {
    mkdirSync(path.dirname(path.join(dir, file.path)), { recursive: true });
    writeFileSync(path.join(dir, file.path), file.content);
  }
};

const print = (line: string) => {
  process.stdout.write(`${line}\n`);
};

// A server's own `postgres` database always exists; each test run creates and drops `postgres_test_<port>` beside it.
const postgresUrl =
  process.env.STACKS_POSTGRES_URL ??
  `postgres://${userInfo().username}@localhost:5432/postgres`;

const writeEnvFiles = (dir: string) => {
  materializeEnvFromExamples(dir, {
    authSecret: "local-secret-that-is-at-least-32-characters",
    postgresDatabaseUrl: postgresUrl,
  });
};

// Loading the generator through Vite sets NODE_ENV=development, which breaks `next build`.
const projectEnv = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => name !== "NODE_ENV")
);

const logTail = (logFile: string, lines = 80) =>
  readFileSync(logFile, "utf-8").trimEnd().split("\n").slice(-lines).join("\n");

const projectionPath = `${repoRoot}packages/integrations/verification.json`;

const environment = {
  arch: arch(),
  node: process.version,
  os: `${platform()} ${release()}`,
};

const hostPlatforms: Partial<Record<NodeJS.Platform, Platform>> = {
  linux: "linux",
  win32: "windows",
};

/** The platform whose records this machine's runs produce; elsewhere `verify` runs the Linux tasks and writes none. */
const hostPlatform = hostPlatforms[platform()];

// Each stack's e2e runner takes a port for the web app and the next for a Hono server, so stacks sit 10 ports apart.
// From 20000 the range stays below the ephemeral ports of Linux (32768) and macOS (49152), which the operating system
// hands to outgoing connections, and clear of the ports `fetch` refuses.
const testPorts = (index: number) => ({
  E2E_TEST_PORT: String(20_000 + index * 10),
});

interface StackRun {
  force: boolean;
  generation: Generation;
  index: number;
  label: string;
  platform: Platform;
  stack: Stack;
  out: string;
}

const browserRunners = new Map([
  ["e2e", e2e],
  ["playwright", playwright],
]);

/**
 * The README's first-run step for e2e tests. The project's own runner installs the browser, because the
 * build it needs follows the version that project resolved, which can trail the latest release.
 */
const browserInstall = (stack: Stack) => {
  const runner =
    stack.framework === undefined || stack.testing === undefined
      ? undefined
      : browserRunners.get(stack.testing);
  return runner === undefined
    ? []
    : [
        `cd ${path.join("apps", "web")} && vp exec ${runner.installer} install chromium && cd ${path.join("..", "..")}`,
      ];
};

const verifyStack = async ({
  force,
  generation,
  index,
  label,
  out,
  platform: taskPlatform,
  stack,
}: StackRun) => {
  const hash = await fingerprint(generation);
  if (!force && verification[taskPlatform][label]?.fingerprint === hash) {
    print(`${label} verified at this output`);
    return true;
  }

  const dir = path.join(out, label);
  writeProject(dir, generation);
  writeEnvFiles(dir);
  const logFile = `${dir}.log`;
  const log = openSync(logFile, "w");
  const started = Date.now();
  const commands = [
    "git init -q",
    ...generation.setup.map((command) => command.run),
    ...browserInstall(stack),
    "vp run ready",
  ];
  const child = spawn(commands.join(" && "), {
    cwd: dir,
    env: { ...projectEnv, ...testPorts(index) },
    shell: true,
    stdio: ["ignore", log, log],
  });
  await once(child, "exit");
  closeSync(log);
  const passed = child.exitCode === 0;
  const seconds = Math.round((Date.now() - started) / 1000);
  if (!passed) {
    print(`${label} FAIL (${seconds}s), see ${logFile}`);
    // On CI the log file stays on the runner, so the reason has to reach the job output.
    print(logTail(logFile));
    return false;
  }
  print(`${label} PASS (${seconds}s)`);
  // After each stack, so an interrupted run keeps what it verified.
  if (hostPlatform !== undefined) {
    const record: StackVerification = {
      environment,
      fingerprint: hash,
      seconds,
      verifiedAt: new Date().toISOString(),
    };
    writeRecords(
      path.join(out, "results"),
      new Map([[`${hostPlatform}/${hash}`, record]])
    );
  }
  return true;
};

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

// A stack's `ready` runs several dev servers and a browser, so a few stacks saturate the CPU.
const defaultJobs = Math.max(1, Math.floor(availableParallelism() / 4));

const usage = `Usage: vp run stacks <command> [pattern] [--out <dir>] [--force] [--jobs <n>] [--package-manager pnpm|bun|all]

  gen [pattern]      write each legal stack whose name matches to <out>/<name>
  pull [--evidence <dir>]
                     read the verification store (the \`verification\` branch, which only CI on main writes)
                     and the records under <dir>, and write the records for the current output to
                     packages/integrations/verification.json, which the CLI and the Studio embed
  check [pattern]    compare that file with the current output of every task, Linux and Windows;
                     no installs, services, or writes
  verify [pattern]   generate, install, set up, and run \`vp run ready\` in each matching task of this
                     platform, skipping tasks verified at their current output (--force reruns them).
                     On Linux and Windows each pass is written to <out>/results; CI records them
  smoke [pattern]    install Hono stacks, check, unit-test, build, and exercise modules/handlers without listening; no record
  goldens            regenerate golden/* from generator output
  plan               print the CI jobs for the tasks verification.json does not cover, as JSON
  evidence <dir>     on CI, copy the records of this pull request's earlier runs (or, on main, of the merged
                     pull request's runs) that match the current output to <dir>
  record <results> <store>
                     on CI, add the records under <results> that match the current output to a store checkout

Every stack is a Linux task; the goldens are also Windows tasks. gen, check, and verify include both
package managers by default. --package-manager narrows the matrix.
Bun is required to install or run Bun package-manager or Hono-runtime combinations.
verify runs --jobs stacks at a time (default ${defaultJobs}), each on its own test ports.
Postgres stacks use STACKS_POSTGRES_URL (default postgres://$USER@localhost:5432/postgres).`;

type Selected = Task & { readonly generation: Generation };

const selectTasks = async (
  selected: readonly Platform[],
  managers: readonly PackageManager[],
  matches: (label: string) => boolean
): Promise<Selected[]> =>
  await Promise.all(
    tasks
      .filter(
        (task) =>
          selected.includes(task.platform) &&
          managers.includes(task.packageManager) &&
          matches(task.label)
      )
      .map(async (task) => ({ ...task, generation: await generateTask(task) }))
  );

const selectStacks = async (
  stacks: readonly Stack[],
  managers: readonly PackageManager[],
  matches: (label: string) => boolean
) =>
  await Promise.all(
    managers
      .flatMap((packageManager) =>
        stacks.map((stack) => ({
          label: `${stackLabel(stack)}${packageManager === "bun" ? "-bun-pm" : ""}`,
          packageManager,
          stack,
        }))
      )
      .filter(({ label }) => matches(label))
      .map(async ({ label, packageManager, stack }) => ({
        generation: await generateProject(stack, packageManager),
        label,
        stack,
      }))
  );

const isCurrent = async (task: Task) =>
  verification[task.platform][task.label]?.fingerprint ===
  (await fingerprint(await generateTask(task)));

const checkTasks = async (selected: readonly Selected[]) => {
  const results = await Promise.all(
    selected.map(async (task) => {
      const current = await isCurrent(task);
      let status = "MISSING";
      if (verification[task.platform][task.label] !== undefined) {
        status = current ? "CURRENT" : "STALE";
      }
      print(`${task.platform} ${task.label} ${status}`);
      return current;
    })
  );
  const current = results.filter(Boolean).length;
  print(`${current} of ${selected.length} tasks verified at current output`);
  return current === selected.length ? 0 : 1;
};

const verifyTasks = async (
  selected: readonly Selected[],
  { force, jobs, out }: { force: boolean; jobs: number; out: string }
) => {
  if (hostPlatform === undefined) {
    print(`Runs on ${platform()} write no results`);
  }
  const verify = limitAsync(verifyStack, jobs);
  const results = await Promise.all(
    selected.map(
      async (task, index) => await verify({ ...task, force, index, out })
    )
  );
  const passed = results.filter(Boolean).length;
  print(`${passed} of ${selected.length} stacks pass`);
  return passed === selected.length ? 0 : 1;
};

const pull = async (evidence: string | undefined) => {
  const store = cloneStore();
  const projection = await projectionOf(
    readRecords(evidence === undefined ? [store] : [store, evidence])
  );
  rmSync(store, { force: true, recursive: true });
  const { code } = await formatWithProjectConfig(
    projectionPath,
    JSON.stringify(projection),
    "@vibestart"
  );
  writeFileSync(projectionPath, code);
  for (const name of platforms) {
    print(
      `${Object.keys(projection[name]).length} of ${tasks.filter((task) => task.platform === name).length} ${name} tasks verified at current output`
    );
  }
};

const plan = async () => {
  const pending = await Promise.all(
    tasks.map(async (task) => ((await isCurrent(task)) ? [] : [task]))
  );
  print(JSON.stringify(batchesOf(pending.flat())));
};

interface Options {
  force: boolean;
  jobs: string;
  out: string;
  "package-manager": string;
}

const runStackCommand = async (
  command: string,
  pattern: string | undefined,
  values: Options
) => {
  const requested = values["package-manager"];
  if (requested !== "pnpm" && requested !== "bun" && requested !== "all") {
    print("--package-manager is pnpm, bun, or all");
    return 1;
  }
  const jobs = Number(values.jobs);
  if (!Number.isInteger(jobs) || jobs < 1) {
    print(`--jobs must be a positive integer, got ${values.jobs}`);
    return 1;
  }
  const managers: readonly PackageManager[] =
    requested === "all" ? ["pnpm", "bun"] : [requested];
  const matching = pattern === undefined ? undefined : new RegExp(pattern, "u");
  const matches = (label: string) =>
    matching === undefined || matching.test(label);
  if (command === "check") {
    return await checkTasks(await selectTasks(platforms, managers, matches));
  }
  mkdirSync(values.out, { recursive: true });
  if (command === "verify") {
    return await verifyTasks(
      await selectTasks([hostPlatform ?? "linux"], managers, matches),
      { force: values.force, jobs, out: values.out }
    );
  }
  if (command === "gen") {
    const selected = await selectStacks(
      legalStacks(registry),
      managers,
      matches
    );
    for (const { generation, label } of selected) {
      writeProject(path.join(values.out, label), generation);
    }
    print(`${selected.length} stacks in ${values.out}`);
    return 0;
  }
  const selected = await selectStacks(
    verifiedStacks.filter((stack) => stack.backend === "hono"),
    managers,
    matches
  );
  const results = selected.map(({ generation, label, stack }) =>
    smokeStack({ generation, label, stack, out: values.out })
  );
  return results.every(Boolean) ? 0 : 1;
};

export const main = async (args: readonly string[]) => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: [...args],
    options: {
      evidence: { type: "string" },
      force: { default: false, type: "boolean" },
      "package-manager": { default: "all", type: "string" },
      jobs: { default: String(defaultJobs), type: "string" },
      out: { default: path.join(tmpdir(), "vibestart-stacks"), type: "string" },
    },
  });
  const [command = "", first, second] = positionals;
  if (command === "goldens") {
    await syncGoldens();
    return 0;
  }
  if (command === "pull") {
    await pull(values.evidence);
    return 0;
  }
  if (command === "plan") {
    await plan();
    return 0;
  }
  if (command === "evidence" && first !== undefined) {
    mkdirSync(first, { recursive: true });
    const written = writeRecords(
      first,
      await currentRecords(readRecords([downloadEvidence(print)]))
    );
    print(`${written} records from earlier runs vouch for the current output`);
    return 0;
  }
  if (command === "record" && first !== undefined && second !== undefined) {
    const written = writeRecords(
      second,
      await currentRecords(readRecords([first]))
    );
    print(`${written} new records`);
    return 0;
  }
  if (["gen", "check", "verify", "smoke"].includes(command)) {
    return await runStackCommand(command, first, values);
  }
  print(usage);
  return command === "" ? 0 : 1;
};
