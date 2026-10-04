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

describe("stack snapshots", () => {
  it("every legal stack has a distinct name", () => {
    expect(new Set(stacks.map(stackLabel)).size).toBe(stacks.length);
  });

  // Each other stack is its Docker sibling without Docker's files (deployment.test.ts).
  it.each(verifiedStacks.map((stack) => ({ name: stackLabel(stack), stack })))(
    "$name",
    async ({ name, stack }) => {
      const { files, setup } = await generate(
        registry,
        verifiedBlueprint(stack),
        { name: verifiedName }
      );
      const rendered = [
        `# setup\n${setup.map((command) => `${command.run}  # writes ${command.writes.join(", ")}`).join("\n")}\n`,
        ...files.map(
          (file) => `# ${file.path} (${file.owner})\n${file.content}`
        ),
      ].join("\n");
      await expect(rendered).toMatchFileSnapshot(
        `__snapshots__/stacks/${name}.txt`
      );
    }
  );
});
