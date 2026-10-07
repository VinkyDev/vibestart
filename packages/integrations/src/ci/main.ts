import { execFileSync, spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import {
  appendFileSync,
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { arch, platform, release } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

import { limitAsync } from "es-toolkit/promise";
import type { z } from "zod";

import type { PackageManager, Stack, Verification } from "@vibestart/core";
import { fingerprint } from "@vibestart/core";

import { toolchainVersions } from "#/catalog.ts";
import { restore } from "#/ci/github.ts";
import type { Plan, Result, Task } from "#/ci/model.ts";
import {
  batchesOf,
  completedResults,
  dependencyInput,
  digest,
  planSchema,
  reportSchema,
  reusable,
  runtimeInput,
  superseded,
} from "#/ci/model.ts";
import {
  generateProject,
  logTail,
  projectEnv,
  testPorts,
  writeEnvFiles,
  writeProject,
} from "#/ci/project.ts";
import { goldens } from "#/goldens.ts";
import { repoRoot } from "#/repo.ts";
import { stackLabel } from "#/stack-label.ts";
import { bunSubjects, verifiedStacks } from "#/verification.ts";

const root = path.join(repoRoot, ".verification");
const artifact = path.join(root, "artifact");
const readJson = <T>(file: string, schema: z.ZodType<T>): T =>
  schema.parse(JSON.parse(readFileSync(file, "utf-8")));
const write = (
  file: string,
  value: Plan | Result | Verification | z.infer<typeof reportSchema>
) => {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value));
};
const print = (line: string) => {
  process.stdout.write(`${line}\n`);
};
const summary = (line: string) => {
  print(line);
  if (process.env.GITHUB_STEP_SUMMARY !== undefined) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
  }
};

const subjects = new Map<string, { stack: Stack; manager: PackageManager }>([
  ...verifiedStacks.map(
    (stack) => [stackLabel(stack), { stack, manager: "pnpm" as const }] as const
  ),
  ...bunSubjects.map(
    (stack) =>
      [
        `${stackLabel(stack)}-bun-pm`,
        { stack, manager: "bun" as const },
      ] as const
  ),
]);

const generationOf = async (label: string) => {
  const subject = subjects.get(label);
  if (subject === undefined) {
    throw new Error(`Unknown verification subject: ${label}`);
  }
  return await generateProject(subject.stack, subject.manager);
};

const policy = () =>
  digest(
    JSON.stringify({
      tools: toolchainVersions,
      files: execFileSync(
        "git",
        [
          "ls-files",
          "-z",
          ".github/workflows/ci.yml",
          ".github/actions",
          "packages/integrations/src/ci",
          "packages/integrations/src/server-env.ts",
          "packages/integrations/src/stacks.ts",
          "packages/core/src/verification.ts",
          "packages/integrations/src/verification.ts",
          "packages/integrations/scripts/stacks.ts",
          "packages/integrations/vite.config.ts",
          "pnpm-lock.yaml",
          ".node-version",
        ],
        { cwd: repoRoot, encoding: "utf-8" }
      )
        .split("\0")
        .filter((file) => file !== "" && !file.endsWith(".test.ts"))
        .map((file) => [
          file,
          readFileSync(path.join(repoRoot, file), "utf-8"),
        ]),
    })
  );

const histories = () => {
  const history = path.join(root, "history");
  if (!existsSync(history)) {
    return [];
  }
  const reports = readdirSync(history).flatMap((dir) => {
    const folder = path.join(history, dir);
    try {
      return [
        {
          report: readJson(path.join(folder, "report.json"), reportSchema),
          folder,
        },
      ];
    } catch {
      return [];
    }
  });
  const failed = reports.flatMap(({ report }) => report.failed);
  return reports
    .flatMap(({ report, folder }) =>
      report.results
        .filter((result) => !superseded(result, failed))
        .map((result) => ({ result, folder }))
    )
    .toSorted((a, b) =>
      b.result.record.verifiedAt.localeCompare(a.result.record.verifiedAt)
    );
};

const validLock = (folder: string, lock: string) => {
  const file = path.join(folder, "locks", lock);
  return existsSync(file) && digest(readFileSync(file, "utf-8")) === lock;
};

const spawnSyncDiff = (before: string, after: string) => {
  const diff = spawnSync("git", ["diff", "--no-index", "--", before, after], {
    encoding: "utf-8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (diff.status !== 0 && diff.status !== 1) {
    throw new Error(`Cannot compare output: ${diff.stderr}`, {
      cause: diff.error,
    });
  }
  return diff.stdout;
};

const makePlan = async (force: boolean, pattern?: string, local = false) => {
  rmSync(path.join(root, "results"), { recursive: true, force: true });
  rmSync(path.join(root, "diffs"), { recursive: true, force: true });
  rmSync(artifact, { recursive: true, force: true });
  if (arch() !== "x64" || (local && !["linux", "win32"].includes(platform()))) {
    throw new Error("Verification requires Linux or Windows x64");
  }
  const history = histories();
  const harness = policy();
  const reused: Result[] = [];
  const tasks: Task[] = [];
  const changes: string[] = [];
  mkdirSync(path.join(artifact, "locks"), { recursive: true });
  mkdirSync(path.join(artifact, "outputs"), { recursive: true });
  await Promise.all(
    [...subjects.keys()]
      .filter(
        (label) => pattern === undefined || new RegExp(pattern, "u").test(label)
      )
      .map(async (label) => {
        const generation = await generationOf(label);
        const full = await fingerprint(generation);
        const runtime = runtimeInput(generation);
        const dependencies = digest(
          JSON.stringify(dependencyInput(generation))
        );
        const output = [
          JSON.stringify(generation.setup),
          ...generation.files.map(
            (file) => `# ${file.path} (${file.owner})\n${file.content}`
          ),
        ].join("\n");
        const outputFile = path.join(artifact, "outputs", `${label}.txt`);
        writeFileSync(outputFile, output);
        const previous = history.find(
          ({ result, folder }) =>
            result.label === label &&
            existsSync(path.join(folder, "outputs", `${label}.txt`))
        );
        if (previous === undefined) {
          changes.push(`${label}: new output`);
        } else {
          const before = path.join(previous.folder, "outputs", `${label}.txt`);
          if (readFileSync(before, "utf-8") !== output) {
            const diff = spawnSyncDiff(before, outputFile);
            mkdirSync(path.join(root, "diffs"), { recursive: true });
            writeFileSync(path.join(root, "diffs", `${label}.diff`), diff);
            changes.push(`${label}: changed output`);
          }
        }
        const platforms: Task["platform"][] = local
          ? [platform() === "win32" ? "windows-2025" : "ubuntu-24.04"]
          : [
              "ubuntu-24.04",
              ...(Object.hasOwn(goldens, label)
                ? ["windows-2025" as const]
                : []),
            ];
        for (const os of platforms) {
          const task: Task = {
            id: `${os}-${label}`,
            label,
            platform: os,
            input: digest(
              JSON.stringify({ runtime, harness, platform: os, arch: "x64" })
            ),
            dependencies,
            fingerprint: full,
          };
          const prior = force
            ? undefined
            : history.find(
                ({ result, folder }) =>
                  reusable(task, result, Date.now()) &&
                  validLock(folder, result.lock)
              );
          const locked =
            prior ??
            (force
              ? undefined
              : history.find(
                  ({ result, folder }) =>
                    result.platform === os &&
                    result.dependencies === dependencies &&
                    validLock(folder, result.lock)
                ));
          if (locked !== undefined) {
            task.lock = locked.result.lock;
            copyFileSync(
              path.join(locked.folder, "locks", task.lock),
              path.join(artifact, "locks", task.lock)
            );
          }
          tasks.push(task);
          if (prior !== undefined) {
            reused.push({
              ...prior.result,
              ...task,
              record: { ...prior.result.record, fingerprint: full },
            });
          }
        }
      })
  );
  const ordered = tasks.toSorted((a, b) => a.id.localeCompare(b.id));
  const cached = new Set(reused.map(({ id }) => id));
  const batches = batchesOf(ordered.filter(({ id }) => !cached.has(id)));
  const plan: Plan = {
    createdAt: new Date().toISOString(),
    tasks: ordered,
    reused,
    batches,
  };
  write(path.join(root, "plan.json"), plan);
  writeFileSync(path.join(root, "changes.txt"), changes.toSorted().join("\n"));
  summary(
    `Verification: ${tasks.length} required, ${reused.length} reused, ${tasks.length - reused.length} to run in ${batches.length} batches. Output changes: ${changes.length}.`
  );
  if (process.env.GITHUB_OUTPUT !== undefined) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `matrix=${JSON.stringify({ include: batches })}\npending=${batches.length > 0}\n`
    );
  }
  return plan;
};

const execute = async (task: Task, index: number) => {
  const generation = await generationOf(task.label);
  if ((await fingerprint(generation)) !== task.fingerprint) {
    throw new Error(`Output changed after planning: ${task.id}`);
  }
  const dir = path.join(root, "projects", task.label);
  writeProject(dir, generation);
  writeEnvFiles(dir);
  const lockName = task.label.endsWith("-bun-pm")
    ? "bun.lock"
    : "pnpm-lock.yaml";
  if (task.lock !== undefined) {
    if (!validLock(artifact, task.lock)) {
      throw new Error(`Invalid lock: ${task.id}`);
    }
    copyFileSync(
      path.join(artifact, "locks", task.lock),
      path.join(dir, lockName)
    );
  }
  const logFile = path.join(root, "logs", `${task.id}.log`);
  mkdirSync(path.dirname(logFile), { recursive: true });
  const log = openSync(logFile, "w");
  const started = Date.now();
  const commands = [
    "git init -q",
    ...generation.setup.map(({ run }) =>
      run === "vp install"
        ? `vp install --${task.lock === undefined ? "no-" : ""}frozen-lockfile`
        : run
    ),
    ...(generation.files.some((file) => file.path === "apps/web/package.json")
      ? [
          `cd apps/web && vp exec ${subjects.get(task.label)?.stack.testing === "e2e" ? "e2e-web" : "playwright"} install chromium && cd ../..`,
        ]
      : []),
    "vp run ready",
  ];
  const child = spawn(commands.join(" && "), {
    cwd: dir,
    shell: true,
    env: { ...projectEnv, ...testPorts(index), VP_GIT_HOOKS: "0" },
    stdio: ["ignore", log, log],
  });
  try {
    await once(child, "exit");
  } finally {
    closeSync(log);
  }
  const seconds = Math.round((Date.now() - started) / 1000);
  if (child.exitCode !== 0) {
    print(`${task.id} FAIL (${seconds}s)\n${logTail(logFile)}`);
    return false;
  }
  const lock = digest(readFileSync(path.join(dir, lockName), "utf-8"));
  if (task.lock !== undefined && lock !== task.lock) {
    throw new Error(`Frozen lock changed: ${task.id}`);
  }
  copyFileSync(path.join(dir, lockName), path.join(artifact, "locks", lock));
  const result: Result = {
    ...task,
    lock,
    key: digest(`${task.input}:${lock}`),
    record: {
      fingerprint: task.fingerprint,
      environment: {
        arch: arch(),
        node: process.version,
        os: `${platform()} ${release()}`,
      },
      seconds,
      verifiedAt: new Date().toISOString(),
    },
    image: process.env.ImageVersion ?? "local",
    source: {
      run: process.env.GITHUB_RUN_ID ?? "local",
      attempt: process.env.GITHUB_RUN_ATTEMPT ?? "1",
      sha: process.env.GITHUB_SHA ?? "local",
      job: process.env.GITHUB_JOB ?? "local",
    },
  };
  write(path.join(root, "results", `${task.id}.json`), result);
  print(`${task.id} PASS (${seconds}s)`);
  return true;
};

const resumeBatch = (plan: Plan, name: string) => {
  const run = process.env.GITHUB_RUN_ID;
  if (run === undefined || Number(process.env.GITHUB_RUN_ATTEMPT ?? 1) < 2) {
    return;
  }
  const dir = path.join(root, "resume", name);
  rmSync(dir, { recursive: true, force: true });
  try {
    execFileSync(
      "gh",
      [
        "run",
        "download",
        run,
        "--repo",
        process.env.GITHUB_REPOSITORY ?? "VinkyDev/vibestart",
        "--name",
        `results-${name}`,
        "--dir",
        dir,
      ],
      { stdio: "pipe", timeout: 120_000 }
    );
  } catch {
    return;
  }
  for (const task of plan.tasks) {
    const file = path.join(dir, "results", `${task.id}.json`);
    if (!existsSync(file)) {
      continue;
    }
    const result = readJson(file, reportSchema.shape.results.element);
    if (
      !reusable(task, result, Date.now()) ||
      result.fingerprint !== task.fingerprint ||
      !validLock(path.join(dir, "artifact"), result.lock)
    ) {
      continue;
    }
    copyFileSync(
      path.join(dir, "artifact", "locks", result.lock),
      path.join(artifact, "locks", result.lock)
    );
    write(path.join(root, "results", `${task.id}.json`), result);
  }
};

const runBatch = async (plan: Plan, name: string) => {
  const batch = plan.batches.find((entry) => entry.name === name);
  if (batch === undefined) {
    throw new Error(`Unknown batch: ${name}`);
  }
  if ((platform() === "win32") !== (batch.platform === "windows-2025")) {
    throw new Error("Batch platform does not match runner");
  }
  resumeBatch(plan, name);
  const executeLimited = limitAsync(
    execute,
    batch.platform === "windows-2025" ? 1 : 2
  );
  const results = await Promise.allSettled(
    plan.tasks
      .filter(
        ({ id }) =>
          batch.tasks.includes(id) &&
          !existsSync(path.join(root, "results", `${id}.json`))
      )
      .map(async (task, index) => await executeLimited(task, index))
  );
  for (const result of results) {
    if (result.status === "rejected") {
      print(String(result.reason));
    }
  }
  return results.every(
    (result) => result.status === "fulfilled" && result.value
  )
    ? 0
    : 1;
};

const report = (plan: Plan) => {
  const dir = path.join(root, "results");
  const results = [
    ...plan.reused,
    ...(existsSync(dir)
      ? readdirSync(dir)
          .filter((file) => file.endsWith(".json"))
          .map((file) =>
            readJson(path.join(dir, file), reportSchema.shape.results.element)
          )
      : []),
  ];
  for (const result of results) {
    if (!validLock(artifact, result.lock)) {
      throw new Error(`Missing lock: ${result.id}`);
    }
  }
  write(path.join(artifact, "report.json"), {
    version: 1,
    results,
    failed: plan.tasks
      .filter((task) => !results.some((result) => result.id === task.id))
      .map(({ id, input }) => ({ id, input, at: plan.createdAt })),
  });
  const completed = completedResults(plan, results);
  write(
    path.join(repoRoot, "packages/integrations/verification/current.json"),
    Object.fromEntries(
      completed
        .filter(({ platform: os }) => os === "ubuntu-24.04")
        .map(({ label, record }) => [label, record])
    )
  );
  summary(
    `All ${completed.length} required verifications passed (${plan.reused.length} reused).`
  );
};

export const verificationCommand = async (args: readonly string[]) => {
  const {
    positionals: [command, name],
    values,
  } = parseArgs({
    args: [...args],
    allowPositionals: true,
    options: { force: { type: "boolean", default: false } },
  });
  if (command === "restore") {
    restore(root);
    return 0;
  }
  if (command === "plan") {
    await makePlan(values.force);
    return 0;
  }
  if (command === "verify") {
    const plan = await makePlan(values.force, name, true);
    plan.batches = [
      {
        name: "local",
        platform:
          platform() === "win32"
            ? ("windows-2025" as const)
            : ("ubuntu-24.04" as const),
        tasks: plan.batches.flatMap((batch) => batch.tasks),
      },
    ].filter((batch) => batch.tasks.length > 0);
    const results = await Promise.all(
      plan.batches.map(async (batch) => await runBatch(plan, batch.name))
    );
    report(plan);
    return results.some(Boolean) ? 1 : 0;
  }
  if (command === "check") {
    const plan = await makePlan(false);
    if (plan.batches.length > 0) {
      return 1;
    }
    report(plan);
    return 0;
  }
  const plan = readJson(path.join(root, "plan.json"), planSchema);
  if (command === "run" && name !== undefined) {
    return await runBatch(plan, name);
  }
  if (command === "report") {
    report(plan);
    return 0;
  }
  throw new Error(`Unknown verification command: ${command}`);
};
