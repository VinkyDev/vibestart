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

  it("signs users in on MongoDB as on a SQL database", () => {
    expect(
      resolve(registry, { auth: "better-auth", database: "mongodb" }).stacks
    ).not.toHaveLength(0);
  });
});
