import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vite-plus/test";

import { goldens } from "#/goldens.ts";
import { taskLabel } from "#/stack-label.ts";
import {
  batchesOf,
  currentRecords,
  pendingTasks,
  projectionOf,
  readRecords,
  tasks,
  writeRecords,
} from "#/verification-store.ts";
import type { StackVerification } from "#/verification.ts";
import {
  emptyProjection,
  verifiedFingerprint,
  verifiedStacks,
} from "#/verification.ts";

const dirs: string[] = [];
const tempDir = () => {
  const dir = mkdtempSync(path.join(tmpdir(), "vibestart-store-test-"));
  dirs.push(dir);
  return dir;
};

const recordOf = (hash: string): StackVerification => ({
  environment: { arch: "x64", node: "v24.21.0", os: "linux 6.17.0" },
  fingerprint: hash,
  seconds: 3,
  verifiedAt: "2026-10-08T00:00:00.000Z",
});

const linux = tasks.filter((task) => task.platform === "linux");
const windows = tasks.filter((task) => task.platform === "windows");

describe("verification tasks", () => {
  it("verify each golden on Windows as the Linux task of the same label", () => {
    expect(windows.map((task) => task.label).toSorted()).toStrictEqual(
      Object.keys(goldens).toSorted()
    );
    const linuxLabels = new Set(linux.map((task) => task.label));
    expect(
      windows.filter((task) => !linuxLabels.has(task.label))
    ).toStrictEqual([]);
  });

  it("offer every verified stack under each package manager on Linux", () => {
    expect(linux.map((task) => task.label).toSorted()).toStrictEqual(
      verifiedStacks
        .flatMap((stack) => [taskLabel(stack), taskLabel(stack, "bun")])
        .toSorted()
    );
  });

  it("name each output once per platform", () => {
    for (const group of [linux, windows]) {
      expect(new Set(group.map((task) => task.label)).size).toBe(group.length);
    }
  });
});

describe(batchesOf, () => {
  it("plans no job when every task is verified", () => {
    expect(batchesOf([])).toStrictEqual([]);
  });

  it("shards Linux tasks by count and runs the Windows goldens on one runner", () => {
    const batches = batchesOf(tasks);
    expect(batches.map((batch) => batch.name)).toStrictEqual([
      ...Array.from({ length: 8 }, (_, shard) => `linux-${shard}`),
      "windows-0",
    ]);
    for (const task of tasks) {
      expect(
        batches.filter(
          (batch) =>
            batch.platform === task.platform &&
            new RegExp(batch.pattern, "u").test(task.label)
        )
      ).toHaveLength(1);
    }
  });

  it("runs a handful of Linux tasks on one runner", () => {
    expect(batchesOf(linux.slice(0, 5))).toHaveLength(1);
  });
});

describe("the store layout", () => {
  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      rmSync(dir, { force: true, recursive: true });
    }
  });

  it("reads back what it writes, and never rewrites a record", () => {
    const dir = tempDir();
    const hash = "a".repeat(64);
    expect(
      writeRecords(dir, new Map([[`linux/${hash}`, recordOf(hash)]]))
    ).toBe(1);
    const later = { ...recordOf(hash), seconds: 9 };
    expect(writeRecords(dir, new Map([[`linux/${hash}`, later]]))).toBe(0);
    expect(readRecords([dir])).toStrictEqual(
      new Map([[`linux/${hash}`, recordOf(hash)]])
    );
  });

  it("finds records at any depth, as artifact downloads nest them", () => {
    const dir = tempDir();
    const hash = "b".repeat(64);
    writeRecords(
      path.join(dir, "123", "results-linux-0"),
      new Map([[`windows/${hash}`, recordOf(hash)]])
    );
    expect([...readRecords([dir]).keys()]).toStrictEqual([`windows/${hash}`]);
  });

  it("rejects a record filed under another fingerprint", () => {
    const dir = tempDir();
    writeRecords(
      dir,
      new Map([[`linux/${"c".repeat(64)}`, recordOf("d".repeat(64))]])
    );
    expect(() => readRecords([dir])).toThrow(/records fingerprint/u);
  });

  it("ignores files outside the layout", () => {
    const dir = tempDir();
    writeFileSync(path.join(dir, "README.md"), "store");
    expect(readRecords([dir]).size).toBe(0);
  });

  it("reads nothing from a directory that is not there, and still reads the others", () => {
    const dir = tempDir();
    const hash = "f".repeat(64);
    writeRecords(dir, new Map([[`linux/${hash}`, recordOf(hash)]]));
    expect([
      ...readRecords([path.join(dir, "absent"), dir]).keys(),
    ]).toStrictEqual([`linux/${hash}`]);
  });
});

describe("records of the current output", () => {
  it("keep only the records whose platform and fingerprint match a task", async () => {
    const task = linux.find(({ label }) => !Object.hasOwn(goldens, label));
    if (task === undefined) {
      throw new Error("Every Linux task is a golden");
    }
    const hash = await verifiedFingerprint(task.stack, task.packageManager);
    const stale = "e".repeat(64);
    const records = new Map([
      [`linux/${hash}`, recordOf(hash)],
      [`windows/${hash}`, recordOf(hash)],
      [`linux/${stale}`, recordOf(stale)],
    ]);
    const current = await currentRecords(records);
    expect([...current.keys()]).toStrictEqual([`linux/${hash}`]);
    const projection = await projectionOf(records);
    expect(projection.linux).toStrictEqual({ [task.label]: recordOf(hash) });
    expect(projection.windows).toStrictEqual({});
    expect(projection.coverage[task.packageManager][task.label]).toStrictEqual({
      by: task.label,
      fingerprint: hash,
    });
  });
});

const plan = await pendingTasks(emptyProjection());

describe(pendingTasks, () => {
  const planned = (packageManager: string) =>
    plan.filter(
      (task) =>
        task.platform === "linux" && task.packageManager === packageManager
    );

  it("runs every golden on both platforms", () => {
    const pnpm = new Set(planned("pnpm").map((task) => task.label));
    expect(
      Object.keys(goldens).filter((label) => !pnpm.has(label))
    ).toStrictEqual([]);
    expect(
      plan
        .filter((task) => task.platform === "windows")
        .map((task) => task.label)
        .toSorted()
    ).toStrictEqual(Object.keys(goldens).toSorted());
  });

  // The point of coverage: a store emptied by a dependency update re-runs a fraction of the stacks.
  it("covers every stack with a fraction of them", () => {
    expect(planned("pnpm").length).toBeLessThan(verifiedStacks.length / 2);
    expect(planned("bun").length).toBeLessThan(verifiedStacks.length / 10);
  });

  it("leaves nothing pending once the planned tasks pass", async () => {
    const records = new Map(
      await Promise.all(
        plan.map(async (task) => {
          const hash = await verifiedFingerprint(
            task.stack,
            task.packageManager
          );
          return [`${task.platform}/${hash}`, recordOf(hash)] as const;
        })
      )
    );
    const projection = await projectionOf(records);
    await expect(pendingTasks(projection)).resolves.toStrictEqual([]);
    for (const packageManager of ["pnpm", "bun"] as const) {
      expect(
        Object.keys(projection.coverage[packageManager]).toSorted()
      ).toStrictEqual(
        verifiedStacks
          .map((stack) => taskLabel(stack, packageManager))
          .toSorted()
      );
    }
  });
});
