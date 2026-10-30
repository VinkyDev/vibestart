import { describe, expect, it } from "vite-plus/test";

import {
  check,
  compose,
  generate,
  createBlueprintSchema,
  legalStacks,
  resolve,
} from "@vibestart/core";

import { registry } from "#/registry.ts";

describe("stack modes", () => {
  it("generates the Effect design without a second transport or state stack", async () => {
    const output = await generate(
      registry,
      {
        stack: compose(registry, { mode: "effect" }),
        addons: [],
        channel: "recommended",
      },
      { name: "effect-app" }
    );

    const manifests = output.files
      .filter(
        ({ path }) =>
          path.endsWith("package.json") || path === "pnpm-workspace.yaml"
      )
      .map(({ content }) => content)
      .join("\n");

    for (const dependency of [
      "@tanstack/react-query",
      "@orpc/",
      '"hono"',
      '"zod"',
      '"undici"',
      '"es-toolkit"',
    ]) {
      expect(manifests).not.toContain(dependency);
    }

    expect(manifests).toContain('"@effect/atom-react"');
    expect(
      output.files.some(({ path }) => path.endsWith("query-client.ts"))
    ).toBeFalsy();
    expect(
      output.files.find(({ path }) => path === "packages/db/src/index.ts")
        ?.content
    ).toContain("drizzle-orm/effect-postgres");
    expect(
      output.files.find(({ path }) => path === "vibestart.jsonc")?.content
    ).toContain('"mode": "effect"');
  });

  it("keeps existing recipes in standard mode", () => {
    const stack = { ...compose(registry, {}) };
    delete stack.mode;
    expect(
      createBlueprintSchema(registry).parse({ channel: "recommended", stack })
        .stack.mode
    ).toBe("standard");
  });

  it("offers the reviewed Effect stack with or without Docker", () => {
    const { stacks } = resolve(registry, { mode: "effect" });
    expect(stacks).toHaveLength(2);

    for (const stack of stacks) {
      expect(stack).toMatchObject({
        mode: "effect",
        frontend: "react",
        framework: "spa",
        router: "tanstack-router",
        backend: "effect-http",
        api: "effect-rpc",
        database: "postgres",
        orm: "drizzle",
        auth: "better-auth",
        ui: "shadcn",
        runtime: "node",
        testing: "e2e",
      });
      expect(stack.desktop).toBeUndefined();
      expect(stack.mobile).toBeUndefined();
    }
  });

  it.each([
    { backend: "hono" },
    { api: "orpc" },
    { orm: "prisma" },
    { database: "mysql" },
    { framework: "next" },
    { runtime: "bun" },
    { mobile: "expo" },
    { desktop: "electron" },
    { deployment: "void" },
    { auth: undefined },
  ])("rejects unadapted choices in Effect mode: %j", (choice) => {
    const stack = { ...compose(registry, { mode: "effect" }), ...choice };
    expect(check(registry, stack).length).toBeGreaterThan(0);
  });

  it("never changes modes while repairing a choice within a mode", () => {
    const result = resolve(
      registry,
      { mode: "effect", database: "mysql" },
      { keep: ["mode"] }
    );

    expect(result.fixes.length).toBeGreaterThan(0);
    expect(
      result.fixes
        .flatMap(({ changes }) => changes)
        .every(({ kind }) => kind !== "mode")
    ).toBeTruthy();
  });

  it("keeps Effect transports out of every standard stack", () => {
    for (const stack of legalStacks(registry).filter(
      ({ mode }) => mode === "standard"
    )) {
      expect(stack.backend).not.toBe("effect-http");
      expect(stack.api).not.toBe("effect-rpc");
    }
  });
});
