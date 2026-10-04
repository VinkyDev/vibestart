import { describe, expect, it } from "vite-plus/test";

import { legalStacks } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { stackLabel } from "#/stack-label.ts";
import {
  bunSubjectOf,
  bunSubjects,
  verification,
  verifiedAs,
  verifiedStacks,
} from "#/verification.ts";

describe("verification.json", () => {
  it("records only the stacks verified as themselves", () => {
    const labels = new Set([
      ...verifiedStacks.map(stackLabel),
      ...bunSubjects.map((stack) => `${stackLabel(stack)}-bun-pm`),
    ]);
    expect(
      Object.keys(verification).filter((label) => !labels.has(label))
    ).toStrictEqual([]);
  });

  it("covers every legal stack with its verification subject for both package managers", () => {
    for (const stack of legalStacks(registry)) {
      expect(verification).toHaveProperty(stackLabel(verifiedAs(stack)));
      expect(verification).toHaveProperty(
        `${stackLabel(bunSubjectOf(stack))}-bun-pm`
      );
    }
  });
});
