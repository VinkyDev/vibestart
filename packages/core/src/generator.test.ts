import { describe, expect, it } from "vite-plus/test";

import { generate } from "#/generator.ts";
import { defineAddon, defineIntegration } from "#/integration.ts";
import { defineRegistry } from "#/registry.ts";

const registryWith = (hasId: string) =>
  defineRegistry({
    addons: [
      defineAddon({
        contribute: () => [
          { path: "lint.txt", render: () => "lint\n", type: "file" },
        ],
        default: true,
        description: "A linter",
        id: "lint",
        name: "Lint",
      }),
      defineAddon({
        contribute: () => [
          { path: "metrics.txt", render: () => "metrics\n", type: "file" },
        ],
        default: false,
        description: "Metrics",
        id: "metrics",
        name: "Metrics",
      }),
    ],
    capabilities: {},
    catalog: {},
    integrations: [
      defineIntegration({
        contribute: (ctx) => [
          {
            path: "has.txt",
            render: () => String(ctx.has(hasId)),
            type: "file",
          },
        ],
        description: "The toolchain",
        id: "vp",
        kind: "toolchain",
        name: "VP",
      }),
    ],
    kinds: [{ id: "toolchain", name: "Toolchain", optional: false }],
  });

const blueprint = {
  addons: [],
  channel: "recommended",
  stack: { toolchain: "vp" },
} as const;

const withAddons = async (addons: readonly string[]) =>
  await generate(
    registryWith("lint"),
    { ...blueprint, addons },
    { name: "my-app" }
  );

describe(generate, () => {
  it("takes several add-ons together, de-duplicates them and records registry order", async () => {
    const generation = await withAddons(["metrics", "lint", "metrics"]);
    expect(generation.files.map(({ path }) => path)).toStrictEqual(
      expect.arrayContaining(["lint.txt", "metrics.txt"])
    );
    expect(
      generation.files.find((f) => f.path === "vibestart.jsonc")?.content
    ).toContain('"addons": ["lint", "metrics"],');
  });

  it("tells an integration whether the stack includes another", async () => {
    const { files } = await generate(registryWith("vp"), blueprint, {
      name: "my-app",
    });
    expect(files.find((file) => file.path === "has.txt")?.content).toBe("true");
  });

  it("tells an integration whether the project takes an add-on", async () => {
    const [taken, left] = await Promise.all([
      withAddons(["lint"]),
      withAddons([]),
    ]);
    expect(taken.files.map(({ owner, path }) => [path, owner])).toContainEqual([
      "lint.txt",
      "lint",
    ]);
    expect(taken.files.find((f) => f.path === "has.txt")?.content).toBe("true");
    expect(left.files.map(({ path }) => path)).not.toContain("lint.txt");
    expect(left.files.find((f) => f.path === "has.txt")?.content).toBe("false");
  });

  it("records the add-ons in the blueprint it writes", async () => {
    const { files } = await generate(
      registryWith("vp"),
      { ...blueprint, addons: ["lint"] },
      { name: "my-app" }
    );
    expect(files.find((f) => f.path === "vibestart.jsonc")?.content).toContain(
      '"addons": ["lint"],'
    );
  });

  it("rejects an add-on the registry does not declare", async () => {
    await expect(
      generate(
        registryWith("vp"),
        { ...blueprint, addons: ["lnt"] },
        { name: "my-app" }
      )
    ).rejects.toThrow('Unknown add-on "lnt"');
  });

  it("rejects an id the registry does not declare", async () => {
    await expect(
      generate(registryWith("vpp"), blueprint, { name: "my-app" })
    ).rejects.toThrow('Unknown integration "vpp"');
  });
});
