import { describe, expect, it } from "vite-plus/test";

import { gateOf } from "#/lib/gate.ts";
import type { Project } from "#/lib/project.ts";

const file = (path: string, content: string) => ({
  content,
  owner: "core",
  path,
});

const project: Project = {
  files: [
    file(
      "package.json",
      JSON.stringify({
        scripts: { ready: "vp check && vp run knip && vp test" },
      })
    ),
    file(
      "packages/api/tests/integration/todos.test.ts",
      [
        'describe("todos", () => {',
        '  it("creates a todo", async () => {});',
        '  it.each(["", " "])("rejects the title %j", async () => {});',
        "});",
      ].join("\n")
    ),
    file(
      "apps/web/tests/e2e/app.e2e.ts",
      [
        'test("signs up", async () => {});',
        'test("signs out", async () => {});',
        "const visit = () => test;",
      ].join("\n")
    ),
  ],
  gettingStarted: [],
  setup: [{ run: "vp run db:generate --name init", writes: [] }],
};

describe(gateOf, () => {
  it("runs the setup commands, then each command of the ready script", () => {
    expect(gateOf(project).commands).toStrictEqual([
      "vp run db:generate --name init",
      "vp check",
      "vp run knip",
      "vp test",
    ]);
  });

  it("counts the test cases each runner declares, not the lines that mention them", () => {
    expect(gateOf(project)).toMatchObject({ files: 3, journeys: 2, tests: 2 });
  });

  it("has no ready commands for a project without a root manifest", () => {
    expect(gateOf({ ...project, files: [], setup: [] }).commands).toStrictEqual(
      []
    );
  });
});
