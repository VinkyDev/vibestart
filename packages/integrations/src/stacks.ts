import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { availableParallelism, platform, tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

import { limitAsync } from "es-toolkit/promise";

import type { PackageManager, Stack } from "@vibestart/core";
import { legalStacks } from "@vibestart/core";

import { downloadEvidence } from "#/evidence.ts";
import { formatWithProjectConfig } from "#/oxfmt.ts";
import { registry } from "#/registry.ts";
import { repoRoot } from "#/repo.ts";
import { taskLabel } from "#/stack-label.ts";
import type { Task } from "#/verification-store.ts";
import {
  batchesOf,
  cloneStore,
  currentRecords,
  pendingTasks,
  projectionOf,
  readRecords,
  tasks,
  writeRecords,
} from "#/verification-store.ts";
import type { Platform } from "#/verification.ts";
import {
  platforms,
  verification,
  verifiedGeneration,
  verifiedFingerprint,
  verifiedStacks,
  vouchesFor,
} from "#/verification.ts";

import { syncGoldens } from "./stacks/goldens.ts";
import { print, writeProject } from "./stacks/project.ts";
import { smokeStack } from "./stacks/smoke.ts";
import { hostPlatform, verifyStack } from "./stacks/verify.ts";

const projectionPath = `${repoRoot}packages/integrations/verification.json`;

// A stack's `ready` runs several dev servers and a browser, so a few stacks saturate the CPU.
const defaultJobs = Math.max(1, Math.floor(availableParallelism() / 4));

const usage = `Usage: vp run stacks <command> [pattern] [--out <dir>] [--force] [--jobs <n>] [--package-manager pnpm|bun|all]

  gen [pattern]      write each legal stack whose name matches to <out>/<name>
  pull [--evidence <dir>]
                     read the verification store (the \`verification\` branch, which only CI on main writes)
                     and the records under <dir>, and write the records for the current output to
                     packages/integrations/verification.json, which the CLI and the Studio embed
  check [pattern]    report whether a record in that file covers the current output of every task,
                     Linux and Windows; no installs, services, or writes
  verify [pattern]   generate, install, set up, and run \`vp run ready\` in each matching task of this
                     platform, skipping tasks verified at their current output (--force reruns them).
                     On Linux and Windows each pass is written to <out>/results; CI records them
  smoke [pattern]    install Hono stacks, check, unit-test, build, and exercise modules/handlers without listening; no record
  goldens            regenerate golden/* from generator output
  plan               print, as JSON, the CI jobs whose passes would cover every task verification.json
                     does not: the fewest stacks that add a pass to each uncovered facet
  evidence <dir>     on CI, copy the records of this pull request's earlier runs (or, on main, of the merged
                     pull request's runs) that match the current output to <dir>
  record <results> <store>
                     on CI, add the records under <results> that match the current output to a store checkout

Every stack is a Linux task under each package manager, covered by any pass that shares its facets
(docs/architecture.md); the goldens are also Windows tasks. gen, check, and verify include both
package managers by default. --package-manager narrows the matrix.
Bun is required to install or run Bun package-manager or Hono-runtime combinations.
verify runs --jobs stacks at a time (default ${defaultJobs}), each on its own test ports.
Postgres stacks use STACKS_POSTGRES_URL (default postgres://$USER@localhost:5432/postgres), MySQL
stacks STACKS_MYSQL_URL (default mysql://root:mysql@localhost:3306/mysql), and MongoDB stacks
STACKS_MONGODB_URL (default mongodb://localhost:27017/stacks).`;

const selectTasks = (
  selected: readonly Platform[],
  managers: readonly PackageManager[],
  matches: (label: string) => boolean
) =>
  tasks.filter(
    (task) =>
      selected.includes(task.platform) &&
      managers.includes(task.packageManager) &&
      matches(task.label)
  );

const selectStacks = async (
  stacks: readonly Stack[],
  managers: readonly PackageManager[],
  matches: (label: string) => boolean
) =>
  await Promise.all(
    managers
      .flatMap((packageManager) =>
        stacks.flatMap((stack) => {
          const label = taskLabel(stack, packageManager);

          return matches(label) ? [{ label, packageManager, stack }] : [];
        })
      )
      .map(async ({ label, packageManager, stack }) => ({
        generation: await verifiedGeneration(stack, packageManager),
        label,
        stack,
      }))
  );

/** A Linux task is current when a record covers it; a Windows task, when its own record does. */
const statusOf = async (task: Task) => {
  if (task.platform === "windows") {
    const record = verification.windows[task.label];

    if (record === undefined) {
      return "MISSING";
    }

    return (await vouchesFor(record, task.stack, task.packageManager))
      ? "CURRENT"
      : "STALE";
  }

  const entry = verification.coverage[task.packageManager][task.label];

  if (entry === undefined || verification.linux[entry.by] === undefined) {
    return "MISSING";
  }

  const current = await verifiedFingerprint(task.stack, task.packageManager);

  if (entry.fingerprint !== current) {
    return "STALE";
  }

  return entry.by === task.label ? "CURRENT" : `CURRENT by ${entry.by}`;
};

const checkTasks = async (selected: readonly Task[]) => {
  const statuses = await Promise.all(
    selected.map(async (task) => {
      const status = await statusOf(task);
      print(`${task.platform} ${task.label} ${status}`);

      return status;
    })
  );

  const current = statuses.filter((status) =>
    status.startsWith("CURRENT")
  ).length;

  print(`${current} of ${selected.length} tasks covered at current output`);

  return current === selected.length ? 0 : 1;
};

const verifyTasks = async (
  selected: readonly Task[],
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

  for (const packageManager of ["pnpm", "bun"] as const) {
    const covered = Object.values(projection.coverage[packageManager]);
    print(
      `${covered.length} of ${verifiedStacks.length} stacks under ${packageManager} covered by ${new Set(covered.map(({ by }) => by)).size} Linux records`
    );
  }

  print(
    `${Object.keys(projection.windows).length} of ${tasks.filter((task) => task.platform === "windows").length} goldens verified on Windows`
  );
};

const plan = async () => {
  print(JSON.stringify(batchesOf(await pendingTasks(verification))));
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
    return await checkTasks(selectTasks(platforms, managers, matches));
  }

  mkdirSync(values.out, { recursive: true });

  if (command === "verify") {
    return await verifyTasks(
      selectTasks([hostPlatform ?? "linux"], managers, matches),
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
