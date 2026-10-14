import { describe, expect, it } from "vite-plus/test";

import { stackLabel } from "#/stack-label.ts";
import { verifiedGeneration, verifiedStacks } from "#/verification.ts";

// Bun moves the workspace and catalog into package.json, trusts the install scripts it must run, and builds its image
// with Bun; the recorded blueprint names the package manager.
const bunOwned = new Set([
  "Dockerfile",
  "package.json",
  "pnpm-workspace.yaml",
  "vibestart.jsonc",
]);

// So a Bun pass only has to vouch for what Bun installs (coverage.ts), and pnpm passes vouch for the rest.
describe("Bun and pnpm generate the same sources and tests", () => {
  it.each(verifiedStacks.map((stack) => ({ label: stackLabel(stack), stack })))(
    "$label",
    async ({ stack }) => {
      const [pnpm, bun] = await Promise.all([
        verifiedGeneration(stack, "pnpm"),
        verifiedGeneration(stack, "bun"),
      ]);

      const pnpmFiles = new Map(pnpm.files.map((file) => [file.path, file]));
      const bunFiles = new Map(bun.files.map((file) => [file.path, file]));

      const changed = [...new Set([...pnpmFiles.keys(), ...bunFiles.keys()])]
        .filter(
          (path) => pnpmFiles.get(path)?.content !== bunFiles.get(path)?.content
        )
        .filter((path) => !bunOwned.has(path));

      expect(changed).toStrictEqual([]);
    }
  );
});
