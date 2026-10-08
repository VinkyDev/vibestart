import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it } from "vite-plus/test";

import { writePlan } from "#/maintenance/apply.ts";
import { readText, writeText } from "#/maintenance/files.ts";
import { snapshotOf } from "#/maintenance/model.ts";

const roots: string[] = [];
const change = (file: string, before: string, after: string) => ({
  after,
  before,
  conflict: false,
  path: file,
});

describe("writing a plan", () => {
  afterAll(() => {
    for (const cwd of roots) {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("writes nothing when any planned file changed after planning", () => {
    const cwd = mkdtempSync(path.join(tmpdir(), "vibestart-apply-"));
    roots.push(cwd);
    writeText(cwd, "package.json", "{}\n");
    writeText(cwd, "Dockerfile", "FROM edited-after-planning\n");
    const plan = {
      changes: [
        change("package.json", "{}\n", '{"private":true}\n'),
        change("Dockerfile", "FROM planned\n", "FROM target\n"),
      ],
      conflicts: [],
      manual: [],
      target: snapshotOf(
        "1.0.0",
        "example",
        { addons: [], channel: "recommended", stack: {} },
        []
      ),
    };
    expect(() => {
      writePlan(cwd, plan);
    }).toThrow("Changed since planning: Dockerfile");
    expect(readText(cwd, "package.json")).toBe("{}\n");
  });
});
