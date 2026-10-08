import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vite-plus/test";

import type { GeneratedFile } from "@vibestart/core";

import { writeText } from "#/maintenance/files.ts";
import { snapshotOf } from "#/maintenance/model.ts";
import { planUpdate } from "#/maintenance/plan.ts";

const roots: string[] = [];
const blueprint = {
  addons: [],
  channel: "recommended",
  packageManager: "bun",
  stack: {},
} as const;
const release = (version: string, source: string) =>
  snapshotOf(version, "example", blueprint, [
    {
      content: `{ "name": "example", "version": "${version}" }\n`,
      owner: "core",
      path: "vibestart.jsonc",
    },
    {
      content: `{"hono":"${version}"}\n`,
      owner: "core",
      path: "package.json",
    },
    { content: source, owner: "hono", path: "apps/server/src/app.ts" },
  ]);
const project = (files: readonly Pick<GeneratedFile, "path" | "content">[]) => {
  const cwd = mkdtempSync(path.join(tmpdir(), "vibestart-plan-"));
  roots.push(cwd);
  for (const file of files) {
    writeText(cwd, file.path, file.content);
  }
  return cwd;
};

describe("upgrade plans", () => {
  afterAll(() => {
    for (const cwd of roots) {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("merges infrastructure, writes the target record, and reports starter source without writing it", () => {
    const base = release("1.0.0", "export const app = 1;\n");
    const target = release("1.1.0", "export const app = 2;\n");
    const plan = planUpdate(project(base.files), base, target);
    expect(
      plan.changes.map(({ path: file, after }) => [file, after])
    ).toStrictEqual([
      ["package.json", '{"hono":"1.1.0"}\n'],
      ["vibestart.jsonc", '{ "name": "example", "version": "1.1.0" }\n'],
    ]);
    expect(plan.manual).toStrictEqual([
      {
        after: "export const app = 2;\n",
        before: "export const app = 1;\n",
        path: "apps/server/src/app.ts",
      },
    ]);
  });

  it("drops a starter-source change the project already made", () => {
    const base = release("1.0.0", "export const app = 1;\n");
    const target = release("1.1.0", "export const app = 2;\n");
    const cwd = project(target.files);
    expect(planUpdate(cwd, base, target).manual).toHaveLength(0);
  });

  it("refuses a target release whose record would leave later upgrades without a base", () => {
    const base = release("1.0.0", "export const app = 1;\n");
    const target = release("1.1.0", "export const app = 1;\n");
    const unrecorded = {
      ...target,
      files: target.files.map((file) =>
        file.path === "vibestart.jsonc"
          ? { ...file, content: '{ "name": "example" }\n' }
          : file
      ),
    };
    expect(() => planUpdate(project(base.files), base, unrecorded)).toThrow(
      "does not record its version"
    );
  });

  it("does not mistake missing managed files for a no-op", () => {
    const base = release("1.0.0", "export const app = 1;\n");
    const cwd = project(
      base.files.filter((file) => file.path !== "package.json")
    );
    expect(
      planUpdate(cwd, base, base).conflicts.map((item) => item.path)
    ).toStrictEqual(["package.json"]);
  });
});
