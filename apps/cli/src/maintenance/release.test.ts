import { describe, expect, it } from "vite-plus/test";

import { snapshotOf } from "#/maintenance/model.ts";
import {
  assertSourceCompatible,
  targetSnapshot,
} from "#/maintenance/release.ts";

const input = { addons: [], channel: "recommended", stack: {} } as const;
const source = {
  content: "export const api = 1;",
  owner: "hono",
  path: "apps/server/src/api.ts",
};
const base = snapshotOf("1.0.0", "business", input, [source]);

describe("application contract upgrades", () => {
  it("rejects non-version targets before running a package manager", async () => {
    await expect(
      targetSnapshot(base, "latest; echo unsafe")
    ).rejects.toMatchObject({ exitCode: 2 });
  });

  it.each(
    [
      [{ ...source, content: "export const api = 2;" }],
      [],
      [source, { ...source, path: "apps/server/src/context.ts" }],
    ].map((files) => ({ files }))
  )(
    "requires a migration for edited, removed or added source: %j",
    ({ files }) => {
      expect(() => {
        assertSourceCompatible(
          base,
          snapshotOf("1.1.0", "business", input, files)
        );
      }).toThrow("requires-migration");
    }
  );

  it("allows a dependency-only update without replacing business source", () => {
    const target = snapshotOf("1.1.0", "business", input, [
      source,
      { content: '{"hono":"2"}', owner: "core", path: "package.json" },
    ]);
    expect(() => {
      assertSourceCompatible(base, target);
    }).not.toThrow();
  });
});
