import { describe, expect, it } from "vite-plus/test";

import { generate, legalStacks } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { stackLabel } from "#/stack-label.ts";
import {
  verifiedBlueprint,
  verifiedName,
  verifiedStacks,
} from "#/verification.ts";

const stacks = legalStacks(registry);

describe("generated stack contracts", () => {
  it("every legal stack has a distinct name", () => {
    expect(new Set(stacks.map(stackLabel)).size).toBe(stacks.length);
  });

  // Each other stack is its Docker sibling without Docker's files (deployment.test.ts).
  it.each(verifiedStacks.map((stack) => ({ name: stackLabel(stack), stack })))(
    "$name",
    async ({ stack }) => {
      const { files, setup } = await generate(
        registry,
        verifiedBlueprint(stack),
        { name: verifiedName }
      );
      const paths = files.map((file) => file.path);
      expect(new Set(paths).size).toBe(paths.length);
      expect(paths).toContain("package.json");
      expect(paths).toContain("vibestart.jsonc");
      expect(setup[0]?.run).toBe("vp install");
      const owners = new Set([
        "core",
        ...registry.integrations.map(({ id }) => id),
        ...registry.addons.map(({ id }) => id),
      ]);
      for (const file of files.filter(({ path }) =>
        path.endsWith("package.json")
      )) {
        expect(() => {
          JSON.parse(file.content);
        }).not.toThrow();
      }
      for (const file of files) {
        expect(owners.has(file.owner)).toBeTruthy();
        expect(file.path).not.toMatch(/(?:^\/|\\|(?:^|\/)\.\.(?:\/|$))/u);
      }
    }
  );
});
