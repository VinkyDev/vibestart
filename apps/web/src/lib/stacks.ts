import { stackEntries } from "virtual:vibestart";

import type { StackEntry } from "#/lib/project.ts";

const { stacks: interned, summaries } = stackEntries;

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
export const stacks: readonly StackEntry[] = interned.map(
  ({ bunVerification, verification, ...entry }) => ({
    ...entry,
    bunVerification: summary(bunVerification),
    verification: summary(verification),
  })
);
