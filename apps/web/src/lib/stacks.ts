import { registry, verificationIndex } from "virtual:vibestart";

import { legalStacks } from "@vibestart/core";
import { stackLabel } from "@vibestart/integrations/stack-label";

import type { StackEntry } from "#/lib/project.ts";

const { stacks: indexes, summaries } = verificationIndex;

const summary = (index: number | null) => {
  if (index === null) {
    return null;
  }

  const found = summaries[index];

  if (found === undefined) {
    throw new Error(`No verification summary at ${index}`);
  }

  return found;
};

/** Every legal stack, with the verification summary each names. */
export const stacks: readonly StackEntry[] = legalStacks(registry).map(
  (stack, index) => {
    const pair = indexes[index];

    if (pair === undefined) {
      throw new Error(`Missing verification indexes for ${stackLabel(stack)}`);
    }

    const [pnpm, bun] = pair;

    return {
      bunVerification: summary(bun),
      label: stackLabel(stack),
      stack,
      verification: summary(pnpm),
    };
  }
);
