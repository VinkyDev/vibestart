import { describe, expect, it } from "vite-plus/test";

import { resolve } from "@vibestart/core";

import { registry } from "#/registry.ts";

describe("the registry", () => {
  it("links every third-party integration to its official site over HTTPS", () => {
    // `self` is vibestart's own glue: the framework's server routes, with no project of its own.
    const linked = [...registry.integrations, ...registry.addons].filter(
      ({ id }) => id !== "self"
    );

    expect(
      linked.flatMap(({ homepage, id }) => (homepage === undefined ? [id] : []))
    ).toStrictEqual([]);

    for (const { homepage } of linked) {
      expect(new URL(homepage ?? "").protocol).toBe("https:");
    }
  });

  // Prisma's SQLite drivers are native modules, which the bundled image cannot carry.
  it.each([
    ["postgres", ["drizzle", "prisma"]],
    ["mysql", ["drizzle", "prisma"]],
    ["sqlite", ["drizzle"]],
    ["mongodb", ["mongoose"]],
  ])("offers %s the ORMs %j", (database, orms) => {
    const offered = new Set(
      resolve(registry, { database }).stacks.map(({ orm }) => String(orm))
    );

    expect([...offered].toSorted((a, b) => a.localeCompare(b))).toStrictEqual(
      orms
    );
  });

  it.each([
    ["framework", ["spa", "tanstack-start"]],
    ["backend", ["hono", "none", "self"]],
    ["database", ["mysql", "none", "postgres"]],
    ["orm", ["drizzle", "none"]],
    ["runtime", ["workers"]],
  ])("runs on Workers with the %s choices %j", (kind, ids) => {
    const offered = new Set(
      resolve(registry, { runtime: "workers" }).stacks.map(
        (stack) => stack[kind] ?? "none"
      )
    );

    expect([...offered].toSorted((a, b) => a.localeCompare(b))).toStrictEqual(
      ids
    );
  });

  it("allows every shadcn stack to change only the UI kit and keeps Solid on UI SDK", () => {
    const { stacks } = resolve(registry, {});

    const sdk = new Set(
      stacks
        .filter((stack) => stack.ui === "ui-sdk")
        .map((stack) => JSON.stringify(stack))
    );

    for (const stack of stacks.filter(
      (candidate) => candidate.ui === "shadcn"
    )) {
      expect(sdk.has(JSON.stringify({ ...stack, ui: "ui-sdk" }))).toBeTruthy();
    }

    expect(
      new Set(
        stacks
          .filter((stack) => stack.frontend === "solid")
          .map((stack) => stack.ui)
      )
    ).toStrictEqual(new Set(["ui-sdk"]));
  });

  it.each(["standard", "effect"])(
    "offers Solid the same %s Vite stacks as React with UI SDK",
    (mode) => {
      const { stacks } = resolve(registry, {
        framework: "spa",
        mode,
        ui: "ui-sdk",
      });

      const variants = (frontend: string) =>
        stacks
          .filter((stack) => stack.frontend === frontend)
          .map(({ frontend: _frontend, router: _router, ...choices }) =>
            JSON.stringify(choices)
          )
          .toSorted();

      expect(variants("solid")).toStrictEqual(variants("react"));
    }
  );

  it("signs users in on MongoDB as on a SQL database", () => {
    expect(
      resolve(registry, { auth: "better-auth", database: "mongodb" }).stacks
    ).not.toHaveLength(0);
  });
});
