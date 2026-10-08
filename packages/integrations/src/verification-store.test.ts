import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vite-plus/test";

import { fingerprint } from "@vibestart/core";

import { goldens } from "#/goldens.ts";
import type { StackVerification } from "#/verification-store.ts";
import {
  batchesOf,
  currentRecords,
  generateTask,
  projectionOf,
  readRecords,
  tasks,
  writeRecords,
} from "#/verification-store.ts";

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

  it("name each output once per platform", () => {
    for (const of of [linux, windows]) {
      expect(new Set(of.map((task) => task.label)).size).toBe(of.length);
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
});

describe("records of the current output", () => {
  it("keep only the records whose platform and fingerprint match a task", async () => {
    const task = linux.find(({ label }) => !Object.hasOwn(goldens, label));
    if (task === undefined) {
      throw new Error("Every Linux task is a golden");
    }
    const hash = await fingerprint(await generateTask(task));
    const stale = "e".repeat(64);
    const records = new Map([
      [`linux/${hash}`, recordOf(hash)],
      [`windows/${hash}`, recordOf(hash)],
      [`linux/${stale}`, recordOf(stale)],
    ]);
    const current = await currentRecords(records);
    expect([...current.keys()]).toStrictEqual([`linux/${hash}`]);
    await expect(projectionOf(records)).resolves.toStrictEqual({
      linux: { [task.label]: recordOf(hash) },
      windows: {},
    });
  });
});
