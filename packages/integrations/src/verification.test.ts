import { describe, expect, it } from "vite-plus/test";

import { legalStacks } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { stackLabel } from "#/stack-label.ts";
import {
  bunSubjectOf,
  bunSubjects,
  verifiedAs,
  verifiedStacks,
} from "#/verification.ts";

describe("verification subjects", () => {
  it("covers every legal stack with its verification subject for both package managers", () => {
    const labels = new Set([
      ...verifiedStacks.map(stackLabel),
      ...bunSubjects.map((stack) => `${stackLabel(stack)}-bun-pm`),
    ]);
    for (const stack of legalStacks(registry)) {
      expect(labels.has(stackLabel(verifiedAs(stack)))).toBeTruthy();
      expect(
        labels.has(`${stackLabel(bunSubjectOf(stack))}-bun-pm`)
      ).toBeTruthy();
    }
  });
});
