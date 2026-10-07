import { describe, expect, it } from "vite-plus/test";

import { fingerprint } from "@vibestart/core";

import type { Plan, Result, Task } from "#/ci/model.ts";
import {
  batchesOf,
  completedResults,
  digest,
  reusable,
  runtimeInput,
  superseded,
} from "#/ci/model.ts";

const task: Task = {
  id: "ubuntu-24-04-demo",
  label: "demo",
  platform: "ubuntu-24.04",
  input: digest("runtime"),
  dependencies: digest("dependencies"),
  fingerprint: digest("output"),
};
const now = Date.parse("2026-10-08T00:00:00Z");
const result: Result = {
  ...task,
  lock: digest("lock"),
  key: digest(`${task.input}:${digest("lock")}`),
  record: {
    fingerprint: task.fingerprint,
    environment: { arch: "x64", node: "v24.21.0", os: "linux" },
    seconds: 30,
    verifiedAt: new Date(now).toISOString(),
  },
  source: { run: "123", attempt: "1", sha: "abc", job: "verify" },
  image: "20261001",
};

describe("verification evidence", () => {
  it("reuses runtime evidence across documentation and ownership changes while output identity changes", async () => {
    const before = {
      files: [
        { path: "README.md", content: "before", owner: "docs" },
        { path: "src/main.ts", content: "export const x = 1;", owner: "core" },
      ],
      setup: [],
    };
    const after = {
      ...before,
      files: before.files.map((file) => ({
        ...file,
        owner: "new-owner",
        content: file.path === "README.md" ? "after" : file.content,
      })),
    };
    expect(runtimeInput(before)).toStrictEqual(runtimeInput(after));
    await expect(fingerprint(before)).resolves.not.toBe(
      await fingerprint(after)
    );
    expect(
      reusable({ ...task, fingerprint: digest("new docs") }, result, now)
    ).toBeTruthy();
  });

  it.each([
    "src/main.ts",
    "page.mdx",
    "package.json",
    "vite.config.ts",
    "docs/guide.md",
  ])("retains %s in runtime inputs", (file) => {
    expect(
      runtimeInput({
        files: [{ path: file, content: "x", owner: "core" }],
        setup: [],
      }).files
    ).toHaveLength(1);
  });

  it("does not reuse changed input, a different platform, expired or future evidence, or a corrupt key", () => {
    expect(
      reusable({ ...task, input: digest("changed") }, result, now)
    ).toBeFalsy();
    expect(reusable({ ...task, id: "windows-demo" }, result, now)).toBeFalsy();
    expect(reusable(task, result, now + 7 * 24 * 60 * 60 * 1000)).toBeFalsy();
    expect(reusable(task, result, now - 1)).toBeFalsy();
    expect(
      reusable(task, { ...result, lock: digest("changed lock") }, now)
    ).toBeFalsy();
  });

  it("a failed fresh verification supersedes older success but not another input or a later pass", () => {
    const failed = [
      { id: task.id, input: task.input, at: new Date(now + 1).toISOString() },
    ];
    expect(superseded(result, failed)).toBeTruthy();
    expect(
      superseded({ ...result, input: digest("other input") }, failed)
    ).toBeFalsy();
    expect(
      superseded(
        {
          ...result,
          record: {
            ...result.record,
            verifiedAt: new Date(now + 2).toISOString(),
          },
        },
        failed
      )
    ).toBeFalsy();
  });

  it("partitions each missing task exactly once, with at most two Windows batches", () => {
    const tasks = Array.from({ length: 20 }, (_, index) => ({
      ...task,
      id: `task-${index}`,
      platform:
        index < 8 ? ("windows-2025" as const) : ("ubuntu-24.04" as const),
    }));
    const batches = batchesOf(tasks);
    expect(
      batches.filter(({ platform }) => platform === "windows-2025")
    ).toHaveLength(2);
    expect(batches.flatMap(({ tasks: ids }) => ids).toSorted()).toStrictEqual(
      tasks.map(({ id }) => id).toSorted()
    );
    expect(batchesOf([])).toStrictEqual([]);
  });

  it("requires every result even when a shard is missing, and rejects duplicate or mismatched results", () => {
    const plan: Plan = {
      createdAt: new Date(now).toISOString(),
      tasks: [task],
      reused: [],
      batches: batchesOf([task]),
    };
    expect(() => completedResults(plan, [])).toThrow("Missing");
    expect(() => completedResults(plan, [result, result])).toThrow("duplicate");
    expect(() =>
      completedResults(plan, [{ ...result, input: digest("stale") }])
    ).toThrow("mismatched");
    expect(() =>
      completedResults(
        { ...plan, tasks: [{ ...task, lock: digest("another lock") }] },
        [result]
      )
    ).toThrow("mismatched");
  });

  it("accepts complete reused evidence and empty plans", () => {
    const plan: Plan = {
      createdAt: new Date(now).toISOString(),
      tasks: [task],
      reused: [result],
      batches: [],
    };
    expect(completedResults(plan, [result])).toStrictEqual([result]);
    expect(
      completedResults(
        {
          createdAt: new Date(now).toISOString(),
          tasks: [],
          reused: [],
          batches: [],
        },
        []
      )
    ).toStrictEqual([]);
  });
});
