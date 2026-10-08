import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { escapeRegExp } from "es-toolkit/string";

import type {
  Generation,
  PackageManager,
  Stack,
  Verification,
} from "@vibestart/core";
import { fingerprint, generate, verificationSchema } from "@vibestart/core";

import { goldens } from "#/goldens.ts";
import { registry } from "#/registry.ts";
import { taskLabel } from "#/stack-label.ts";
import type { Platform, Projection } from "#/verification.ts";
import {
  bunSubjects,
  platforms,
  verifiedBlueprint,
  verifiedName,
  verifiedStacks,
} from "#/verification.ts";

export type StackVerification = Verification[string];

/** One stack to run `vp run ready` in, on one platform. */
export interface Task {
  readonly label: string;
  readonly packageManager: PackageManager;
  readonly platform: Platform;
  readonly stack: Stack;
}

export const tasks: readonly Task[] = [
  ...verifiedStacks.map((stack): Task => ({
    label: taskLabel(stack),
    packageManager: "pnpm",
    platform: "linux",
    stack,
  })),
  ...bunSubjects.map((stack): Task => ({
    label: taskLabel(stack, "bun"),
    packageManager: "bun",
    platform: "linux",
    stack,
  })),
  ...Object.values(goldens).map((stack): Task => ({
    label: taskLabel(stack),
    packageManager: "pnpm",
    platform: "windows",
    stack,
  })),
];

const generations = new Map<string, Promise<Generation>>();

/** A label names one output, so the platforms of a stack share its generation. */
export const generateTask = async ({ label, packageManager, stack }: Task) => {
  const generation =
    generations.get(label) ??
    generate(registry, verifiedBlueprint(stack, packageManager), {
      name: verifiedName,
    });
  generations.set(label, generation);
  return await generation;
};

/** A record vouches for one output on one platform: `<platform>/<fingerprint>`. */
const keyOf = async (task: Task) =>
  `${task.platform}/${await fingerprint(await generateTask(task))}`;

/**
 * The branch CI on `main` writes, and nothing else does. Each record is a file `<platform>/<fingerprint>.json`, so
 * a record is never rewritten and concurrent writers never touch the same file.
 */
const store = {
  branch: "verification",
  repository: "https://github.com/VinkyDev/vibestart.git",
};

export const cloneStore = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "vibestart-verification-"));
  execFileSync(
    "git",
    [
      "clone",
      "--quiet",
      "--depth",
      "1",
      "--single-branch",
      "--branch",
      store.branch,
      store.repository,
      dir,
    ],
    { stdio: "inherit" }
  );
  return dir;
};

const recordPath = new RegExp(
  `(?:^|/)(?<key>(?:${platforms.join("|")})/[\\da-f]{64})\\.json$`,
  "u"
);

/** The records in the store layout under each directory, at any depth, by key. */
export const readRecords = (dirs: readonly string[]) => {
  const records = new Map<string, StackVerification>();
  for (const dir of dirs) {
    // download-artifact leaves the path uncreated when a run uploaded nothing.
    if (!existsSync(dir)) {
      continue;
    }
    for (const entry of readdirSync(dir, {
      encoding: "utf-8",
      recursive: true,
    })) {
      const key = recordPath.exec(entry.split(path.sep).join("/"))?.groups?.key;
      if (key === undefined) {
        continue;
      }
      const record = verificationSchema.valueType.parse(
        JSON.parse(readFileSync(path.join(dir, entry), "utf-8"))
      );
      if (!key.endsWith(`/${record.fingerprint}`)) {
        throw new Error(
          `${path.join(dir, entry)} records fingerprint ${record.fingerprint}`
        );
      }
      records.set(key, record);
    }
  }
  return records;
};

/** Writes each record into `dir` in the store layout; a record already there stays as it was. */
export const writeRecords = (
  dir: string,
  records: ReadonlyMap<string, StackVerification>
) => {
  let written = 0;
  for (const [key, record] of records) {
    const file = path.join(dir, `${key}.json`);
    if (!existsSync(file)) {
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
      written += 1;
    }
  }
  return written;
};

/** The records that vouch for a task at the current output. */
export const currentRecords = async (
  records: ReadonlyMap<string, StackVerification>
) => {
  const keys = await Promise.all(tasks.map(keyOf));
  return new Map(
    keys.flatMap((key) => {
      const record = records.get(key);
      return record === undefined ? [] : [[key, record] as const];
    })
  );
};

/** Each platform's records for the current output, by label. */
export const projectionOf = async (
  records: ReadonlyMap<string, StackVerification>
): Promise<Projection> => {
  const entries = await Promise.all(
    tasks.map(async (task) => ({
      record: records.get(await keyOf(task)),
      task,
    }))
  );
  const projection: Projection = { linux: {}, windows: {} };
  for (const { record, task } of entries.toSorted((a, b) =>
    a.task.label.localeCompare(b.task.label)
  )) {
    if (record !== undefined) {
      projection[task.platform][task.label] = record;
    }
  }
  return projection;
};

const exactly = (labels: readonly string[]) =>
  `^(?:${labels.map(escapeRegExp).join("|")})$`;

/**
 * Most of a job is preparing the runner, and a stack verifies in under a minute. Linux runs two stacks at a time
 * across up to eight shards; Windows runs its goldens one at a time on a single runner.
 */
const capacity = {
  linux: { jobs: 2, runner: "ubuntu-24.04", shards: 8 },
  windows: { jobs: 1, runner: "windows-2025", shards: 1 },
} satisfies Record<Platform, { jobs: number; runner: string; shards: number }>;

const stacksPerShard = 12;

/** CI jobs for the tasks no record vouches for, `<platform>-<shard>`, each taking every n-th task in label order. */
export const batchesOf = (pending: readonly Task[]) =>
  platforms.flatMap((platform) => {
    const labels = pending
      .filter((task) => task.platform === platform)
      .map((task) => task.label)
      .toSorted();
    const { jobs, runner, shards: maxShards } = capacity[platform];
    const shards = Math.min(
      maxShards,
      Math.ceil(labels.length / stacksPerShard)
    );
    return Array.from({ length: shards }, (_, shard) => ({
      jobs,
      name: `${platform}-${shard}`,
      pattern: exactly(
        labels.filter((_label, order) => order % shards === shard)
      ),
      platform,
      runner,
    }));
  });
