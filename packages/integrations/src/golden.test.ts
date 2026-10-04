import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vite-plus/test";

import { generate } from "@vibestart/core";

import { goldenPaths, goldenRoot, goldens } from "#/goldens.ts";
import { registry } from "#/registry.ts";
import { verifiedBlueprint, verifiedName } from "#/verification.ts";

const generations = await Promise.all(
  Object.entries(goldens).map(async ([golden, stack]) => ({
    generation: await generate(registry, verifiedBlueprint(stack), {
      name: verifiedName,
    }),
    golden,
    stack,
  }))
);

describe("the golden projects", () => {
  it("together use every integration", () => {
    const used = new Set(
      Object.values(goldens).flatMap((stack) => Object.values(stack))
    );
    expect(
      registry.integrations
        .map((integration) => integration.id)
        .filter((id) => !used.has(id))
    ).toStrictEqual([]);
  });
});

describe.each(generations)("$golden", ({ generation, golden, stack }) => {
  const { files, setup } = generation;
  const setupWrites = setup.flatMap((command) => command.writes);
  const expected = new Map(
    goldenPaths(golden)
      .filter(
        (file) => !setupWrites.some((glob) => path.matchesGlob(file, glob))
      )
      .map((file) => [
        file,
        readFileSync(`${goldenRoot(golden)}${file}`, "utf-8"),
      ])
  );
  const generated = new Map(files.map((file) => [file.path, file.content]));

  it("runs install, then generates route types or the route tree, and the initial migration", () => {
    expect(setup.map((command) => command.run)).toStrictEqual([
      "vp install",
      ...(stack.framework === "next" ? ["vp run typegen"] : []),
      ...(stack.router === "tanstack-router" ? ["vp build apps/web"] : []),
      "vp run db:generate --name init",
    ]);
  });

  it("generates exactly the golden paths", () => {
    expect([...generated.keys()].toSorted()).toStrictEqual(
      [...expected.keys()].toSorted()
    );
  });

  it.each([...expected.keys()])("%s", (file) => {
    expect(generated.get(file)).toBe(expected.get(file));
  });
});
