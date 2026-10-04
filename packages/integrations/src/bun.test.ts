import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

import { compose, defaultAddons, generate, legalStacks } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { stackLabel } from "#/stack-label.ts";

const cases = ["pnpm", "bun"].flatMap((packageManager) =>
  ["node", "bun"].map((runtime) => ({ packageManager, runtime }))
);

const manifest = z.looseObject({
  devEngines: z.object({ packageManager: z.object({ name: z.string() }) }),
  workspaces: z
    .object({
      packages: z.array(z.string()),
      catalog: z.record(z.string(), z.string()),
    })
    .optional(),
});

describe("package manager and Hono runtime", () => {
  it.each(cases)(
    "$packageManager installs, $runtime runs Hono",
    async ({ packageManager, runtime }) => {
      const stack = compose(registry, {
        backend: "hono",
        framework: "spa",
        runtime,
      });
      const generation = await generate(
        registry,
        {
          addons: defaultAddons(registry),
          channel: "recommended",
          stack,
          packageManager: packageManager === "bun" ? "bun" : "pnpm",
        },
        { name: "my-app" }
      );
      const files = new Map(
        generation.files.map((file) => [file.path, file.content])
      );
      const root = manifest.parse(
        JSON.parse(files.get("package.json") ?? "{}")
      );
      expect({
        manager: root.devEngines.packageManager.name,
        pnpmWorkspace: files.has("pnpm-workspace.yaml"),
        bunCatalog: root.workspaces?.catalog.hono !== undefined,
        lock: generation.setup[0]?.writes,
      }).toStrictEqual({
        manager: packageManager,
        pnpmWorkspace: packageManager === "pnpm",
        bunCatalog: packageManager === "bun",
        lock: [packageManager === "bun" ? "bun.lock" : "pnpm-lock.yaml"],
      });
      expect(
        files.get("apps/server/src/index.ts")?.includes('from "bun"')
      ).toBe(runtime === "bun");
      expect(files.get("apps/web/tests/support/server.ts")).toMatch(
        runtime === "bun" ? /,\s*"bun"\s*\)/u : /spawn\(process\.execPath/u
      );
      expect(files.get("packages/db/src/index.ts")).toContain(
        "drizzle-orm/node-sqlite"
      );
    }
  );

  it("keeps Node as the default and offers Bun only beside Hono", () => {
    expect(compose(registry, {}).runtime).toBe("node");
    expect(
      legalStacks(registry)
        .filter((stack) => stack.runtime === "bun")
        .every((stack) => stack.backend === "hono")
    ).toBeTruthy();
    expect(new Set(legalStacks(registry).map(stackLabel)).size).toBe(
      legalStacks(registry).length
    );
  });
});
