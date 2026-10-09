import { describe, expect, it } from "vite-plus/test";

import type { Stack } from "@vibestart/core";
import { compose, createBlueprintSchema, resolve } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { stackLabel } from "#/stack-label.ts";
import { verifiedGeneration, verifiedStacks } from "#/verification.ts";

const journeys = import.meta.glob<string>(
  "../../templates/testing/*/*/apps/web/tests/e2e/app.e2e.ts",
  { eager: true, import: "default", query: "?raw" }
);

const journeysOf = (runner: string) =>
  new Map(
    Object.entries(journeys).flatMap(([path, content]) => {
      const [, owner, variant] =
        /testing\/(?<owner>[^/]+)\/(?<variant>[^/]+)\//u.exec(path) ?? [];
      return owner === runner && variant !== undefined
        ? [
            [
              variant,
              [...content.matchAll(/^test\("(?<title>[^"]+)"/gmu)].map(
                ({ groups }) => groups?.title
              ),
            ],
          ]
        : [];
    })
  );

const filesOf = async (stack: Stack) => {
  const { files } = await verifiedGeneration(stack);
  return new Map(files.map(({ path, content }) => [path, content]));
};

const runnerFiles = new Set([
  ".dockerignore",
  ".gitignore",
  "AGENTS.md",
  "README.md",
  "apps/web/e2e.config.ts",
  "apps/web/package.json",
  "apps/web/playwright.config.ts",
  "apps/web/tests/support/start.ts",
  "knip.json",
  "package.json",
  "pnpm-workspace.yaml",
  "vibestart.jsonc",
]);

const ownedByRunner = (path: string) =>
  runnerFiles.has(path) || path.startsWith("apps/web/tests/e2e/");

const e2eStacks = verifiedStacks
  .filter((stack) => stack.testing === "e2e")
  .map((stack) => ({ label: stackLabel(stack), stack }));

const recordedRunner = (testing: string) =>
  createBlueprintSchema(registry).parse({
    channel: "recommended",
    stack: { testing, toolchain: "vite-plus" },
  }).stack.testing;

describe("choosing the browser test runner", () => {
  it("defaults to Playwright", () => {
    expect(compose(registry, {}).testing).toBe("playwright");
  });

  it("offers e2e only to a stack with a web app", () => {
    expect(
      resolve(registry, { framework: null, testing: "e2e" }).stacks
    ).toStrictEqual([]);
  });

  it("reads the runner ids that earlier releases wrote", () => {
    expect(recordedRunner("vitest-playwright")).toBe("playwright");
    expect(recordedRunner("vitest-e2e")).toBe("e2e");
  });

  it("runs the same journeys under either runner", () => {
    const e2e = journeysOf("e2e");
    expect(e2e.size).toBeGreaterThan(0);
    expect(e2e).toStrictEqual(journeysOf("playwright"));
  });
});

describe("an e2e stack differs from its Playwright sibling only in the runner's files", () => {
  it.each(e2eStacks)("$label", async ({ stack }) => {
    const [e2e, playwright] = await Promise.all([
      filesOf(stack),
      filesOf({ ...stack, testing: "playwright" }),
    ]);
    const changed = [...new Set([...e2e.keys(), ...playwright.keys()])].filter(
      (path) => e2e.get(path) !== playwright.get(path)
    );
    expect(changed.filter((path) => !ownedByRunner(path))).toStrictEqual([]);
  });
});
