import { describe, expect, it } from "vite-plus/test";
import { z } from "zod";

import { compose } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { verifiedGeneration } from "#/verification.ts";

describe("shadcn CLI install targets", () => {
  it("treats hooks installed by the CLI as vendored source", async () => {
    const { files } = await verifiedGeneration(
      compose(registry, { framework: "spa", ui: "shadcn" })
    );

    expect(
      files.find((file) => file.path === "vite.config.ts")?.content
    ).toContain('"packages/ui/src/hooks/**"');
  });

  it.each([
    ["pnpm", "pnpm dlx"],
    ["bun", "bunx --bun"],
  ] as const)(
    "documents adding components with %s",
    async (packageManager, runner) => {
      const { files } = await verifiedGeneration(
        compose(registry, { framework: "spa", ui: "shadcn" }),
        packageManager
      );

      expect(
        files.find((file) => file.path === "AGENTS.md")?.content
      ).toContain(`${runner} shadcn@latest add <component>`);
    }
  );

  it.each(["spa", "next", "tanstack-start"])(
    "%s shares hook install targets before the first hook exists",
    async (framework) => {
      const { files } = await verifiedGeneration(
        compose(registry, { framework, ui: "shadcn" })
      );

      const manifest = files.find(
        (file) => file.path === "packages/ui/package.json"
      );

      if (manifest === undefined) {
        throw new Error("shadcn must generate a shared UI package");
      }

      const { exports } = z
        .object({ exports: z.record(z.string(), z.string()) })
        .parse(JSON.parse(manifest.content));

      expect(exports["./hooks/*"]).toBe("./src/hooks/*.ts");

      const hookAlias = (filePath: string) =>
        z
          .object({ aliases: z.object({ hooks: z.string() }) })
          .parse(
            JSON.parse(
              files.find((file) => file.path === filePath)?.content ?? "{}"
            )
          ).aliases.hooks;

      expect(hookAlias("apps/web/components.json")).toBe(
        hookAlias("packages/ui/components.json")
      );
      expect(
        files.some((file) => file.path.startsWith("packages/ui/src/hooks/"))
      ).toBeFalsy();
    }
  );
});
