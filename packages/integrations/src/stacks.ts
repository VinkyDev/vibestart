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

import type {
  Generation,
  PackageManager,
  Stack,
  Verification,
} from "@vibestart/core";
import {
  fingerprint,
  generate,
  legalStacks,
  verificationSchema,
} from "@vibestart/core";

import { goldenPaths, goldenRoot, goldens } from "#/goldens.ts";
import { formatWithProjectConfig } from "#/oxfmt.ts";
import { registry } from "#/registry.ts";
import { repoRoot } from "#/repo.ts";
import { materializeEnvFromExamples } from "#/server-env.ts";
import { stackLabel } from "#/stack-label.ts";
import {
  bunSubjects,
  verification as recorded,
  verifiedBlueprint,
  verifiedName,
  verifiedStacks,
} from "#/verification.ts";

import httpSmoke from "../templates/vitest-playwright/http-smoke/http-smoke.mjs.txt?raw";

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

const verificationPath = `${repoRoot}packages/integrations/verification.json`;

type StackVerification = Verification[string];

const writeVerification = async (
  verification: ReadonlyMap<string, StackVerification>
) => {
  const sorted = Object.fromEntries(
    [...verification].toSorted(([a], [b]) => a.localeCompare(b))
  );
  const { code } = await formatWithProjectConfig(
    verificationPath,
    JSON.stringify(sorted),
    "@vibestart"
  );
  writeFileSync(verificationPath, code);
};

const environment = {
  arch: arch(),
  node: process.version,
  os: `${platform()} ${release()}`,
};

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
  stack: Stack;
  out: string;
  verification: Map<string, StackVerification>;
}

const verifyStack = async ({
  force,
  generation,
  index,
  label,
  out,
  verification,
}: StackRun) => {
  const hash = await fingerprint(generation);
  if (!force && verification.get(label)?.fingerprint === hash) {
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
  if (passed) {
    verification.set(label, {
      environment,
      fingerprint: hash,
      seconds,
      verifiedAt: new Date().toISOString(),
    });
    print(`${label} PASS (${seconds}s)`);
  } else {
    verification.delete(label);
    print(`${label} FAIL (${seconds}s), see ${logFile}`);
    // On CI the log file stays on the runner, so the reason has to reach the job output.
    print(logTail(logFile));
  }
  // After each stack, so an interrupted run keeps what it verified.
  await writeVerification(verification);
  return passed;
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

const verifiedLabels = [
  ...verifiedStacks.map((stack) => stackLabel(stack)),
  ...bunSubjects.map((stack) => `${stackLabel(stack)}-bun-pm`),
].toSorted();

const shardOf = (label: string, shards: number) =>
  verifiedLabels.indexOf(label) % shards;

/** A shard answers for the labels it owns; one that left no file keeps the repository's. */
const mergeShards = async (dir: string, shards: number) => {
  const merged = new Map(Object.entries(recorded));
  for (let index = 0; index < shards; index += 1) {
    const file = path.join(dir, `shard-${index}`, "verification.json");
    if (!existsSync(file)) {
      print(`shard ${index} left no records`);
      continue;
    }
    const shard = verificationSchema.parse(
      JSON.parse(readFileSync(file, "utf-8"))
    );
    for (const label of verifiedLabels.filter(
      (name) => shardOf(name, shards) === index
    )) {
      const record = shard[label];
      if (record === undefined) {
        merged.delete(label);
      } else {
        merged.set(label, record);
      }
    }
  }
  await writeVerification(merged);
};

const shardPattern = /^(?<index>\d+)\/(?<count>\d+)$/u;

// A stack's `ready` runs several dev servers and a browser, so a few stacks saturate the CPU.
const defaultJobs = Math.max(1, Math.floor(availableParallelism() / 4));

const usage = `Usage: vp run stacks <command> [pattern] [--out <dir>] [--force] [--jobs <n>] [--package-manager pnpm|bun|all] [--shard <i>/<n>]

  gen [pattern]      write each legal stack whose name matches to <out>/<name>
  check [pattern]    compare verification records with current output; no installs, services, or writes
  verify [pattern]   generate, install, set up, and run \`vp run ready\` in each matching stack,
                     skipping stacks verified at their current output (--force reruns them),
                     and records each result in packages/integrations/verification.json
  smoke [pattern]   install Hono stacks, check, unit-test, build, and exercise modules/handlers without listening; no verification record
  merge <dir> --shards <n>
                     combine the verification.json each \`verify --shard <i>/<n>\` wrote to <dir>/shard-<i>/
                     into packages/integrations/verification.json
  goldens            regenerate golden/* from generator output

gen, check, and verify include both package managers by default. --package-manager narrows the matrix.
Bun is required to install or run Bun package-manager or Hono-runtime combinations.
--shard <i>/<n> (0-based) takes every n-th stack by name, so n machines each verify a share; merge joins the shares.
verify runs --jobs stacks at a time (default ${defaultJobs}), each on its own test ports.
Postgres stacks use STACKS_POSTGRES_URL (default postgres://$USER@localhost:5432/postgres).`;

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
  const stacksFor = (packageManager: PackageManager) => {
    if (command === "gen") {
      return legalStacks(registry);
    }
    return packageManager === "bun" && ["check", "verify"].includes(command)
      ? bunSubjects
      : verifiedStacks;
  };
  return await Promise.all(
    managers
      .flatMap((packageManager) =>
        stacksFor(packageManager).map((stack) => ({
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

type Selected = Awaited<ReturnType<typeof selectStacks>>;

const checkStacks = async (selected: Selected) => {
  const results = await Promise.all(
    selected.map(async ({ generation, label }) => {
      const record = recorded[label];
      const current = record?.fingerprint === (await fingerprint(generation));
      let status = "MISSING";
      if (record !== undefined) {
        status = current ? "CURRENT" : "STALE";
      }
      print(`${label} ${status}`);
      return current;
    })
  );
  const current = results.filter(Boolean).length;
  print(`${current} of ${selected.length} stacks verified at current output`);
  return current === selected.length ? 0 : 1;
};

const verifyStacks = async (
  selected: Selected,
  { force, jobs, out }: { force: boolean; jobs: number; out: string }
) => {
  const labels = new Set(verifiedLabels);
  const verified = new Map(
    Object.entries(recorded).filter(([label]) => labels.has(label))
  );
  const verify = limitAsync(verifyStack, jobs);
  const results = await Promise.all(
    selected.map(
      async ({ generation, label, stack }, index) =>
        await verify({
          force,
          generation,
          index,
          label,
          stack,
          out,
          verification: verified,
        })
    )
  );
  const passed = results.filter(Boolean).length;
  print(`${passed} of ${selected.length} stacks pass`);
  return passed === selected.length ? 0 : 1;
};

interface Options {
  force: boolean;
  jobs: string;
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
  const jobs = Number(values.jobs);
  if (!Number.isInteger(jobs) || jobs < 1) {
    print(`--jobs must be a positive integer, got ${values.jobs}`);
    return 1;
  }
  const selected = await selectStacks({
    command,
    managers: requested === "all" ? ["pnpm", "bun"] : [requested],
    matching: pattern === undefined ? undefined : new RegExp(pattern, "u"),
    shard,
  });
  if (command === "check") {
    return await checkStacks(selected);
  }
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
  return await verifyStacks(selected, {
    force: values.force,
    jobs,
    out: values.out,
  });
};

export const main = async (args: readonly string[]) => {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    args: [...args],
    options: {
      force: { default: false, type: "boolean" },
      "package-manager": { default: "all", type: "string" },
      jobs: { default: String(defaultJobs), type: "string" },
      out: { default: path.join(tmpdir(), "vibestart-stacks"), type: "string" },
      shard: { default: "0/1", type: "string" },
      shards: { type: "string" },
    },
  });
  const [command = "", pattern] = positionals;
  if (command === "merge") {
    const shards = Number(values.shards);
    if (pattern === undefined || !Number.isInteger(shards) || shards < 1) {
      print("merge needs <dir> and --shards <n>");
      return 1;
    }
    await mergeShards(pattern, shards);
    return 0;
  }
  if (command === "goldens") {
    await syncGoldens();
    return 0;
  }
  if (["gen", "check", "verify", "smoke"].includes(command)) {
    return await runStackCommand(command, pattern, values);
  }
  print(usage);
  return command === "" ? 0 : 1;
};
