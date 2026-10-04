import { describe, expect, it } from "vite-plus/test";

import { bunWorkspace } from "#/bun-workspace.ts";

// Multiple integrations may contribute policy for the same native dependency.
describe("Bun dependency build policy", () => {
  it.each([true, false])(
    "uses the final allowBuilds decision: %s",
    (allowed) => {
      const workspace = bunWorkspace([], {}, new Set(), [
        { allowBuilds: { electron: !allowed, esbuild: false } },
        { allowBuilds: { electron: allowed } },
      ]);
      expect(workspace.trustedDependencies.includes("electron")).toBe(allowed);
      expect(workspace.trustedDependencies).not.toContain("esbuild");
      expect(workspace.trustedDependencies).toContain("vite-plus");
    }
  );
});
