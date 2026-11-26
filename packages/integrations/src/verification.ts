import type { Blueprint, PackageManager, Stack } from "@vibestart/core";
import {
  defaultAddons,
  defaultsCover,
  fingerprint,
  generate,
  legalStacks,
} from "@vibestart/core";

import type { Facets } from "#/coverage.ts";
import { bunFacets, pnpmFacets } from "#/coverage.ts";
import { registry } from "#/registry.ts";
import { stackLabel, taskLabel } from "#/stack-label.ts";
import {
  emptyProjection,
  projectionSchema,
} from "#/verification-projection.ts";
import type {
  Projection,
  StackVerification,
} from "#/verification-projection.ts";

/** `vp run stacks pull` writes this from the verification store; a checkout without it verifies nothing. */
const projections = import.meta.glob("../verification.json", {
  eager: true,
  import: "default",
});

/** Templates are files of a project with this name, so stacks are verified under it. */
export const verifiedName = "my-app";

export const verification = projectionSchema.parse(
  projections["../verification.json"] ?? emptyProjection()
);

const legal = new Map(
  legalStacks(registry).map((stack) => [stackLabel(stack), stack])
);

/** Docker adds only its own files and docs, so a stack without a deployment is verified as its Docker sibling. */
export const verifiedAs = (stack: Stack): Stack =>
  stack.deployment === undefined
    ? (legal.get(stackLabel({ ...stack, deployment: "docker" })) ?? stack)
    : stack;

export const verifiedStacks = [...legal.values()].filter(
  (stack) => verifiedAs(stack) === stack
);

export const verifiedBlueprint = (
  stack: Stack,
  packageManager?: PackageManager
): Blueprint => {
  const blueprint: Blueprint = {
    addons: defaultAddons(registry),
    channel: "recommended",
    stack,
  };

  if (packageManager === "bun") {
    return { ...blueprint, packageManager };
  }

  return blueprint;
};

/** The project a stack is verified as: the default add-ons, under `verifiedName`. */
export const verifiedGeneration = async (
  stack: Stack,
  packageManager?: PackageManager
) =>
  await generate(registry, verifiedBlueprint(stack, packageManager), {
    name: verifiedName,
  });

interface VerifiedOutput {
  readonly facets: Facets;
  readonly fingerprint: string;
}

/** A label names one output, so each is generated and analyzed once; a generation is too large to keep. */
const outputs = new Map<string, Promise<VerifiedOutput>>();

/** The fingerprint of the task's output, and the facets a pass of it vouches for. */
export const verifiedOutput = async (
  stack: Stack,
  packageManager: PackageManager = "pnpm"
) => {
  const label = taskLabel(stack, packageManager);
  let pending = outputs.get(label);

  if (pending === undefined) {
    pending = (async () => {
      const generation = await verifiedGeneration(stack, packageManager);
      const facetsOf = packageManager === "bun" ? bunFacets : pnpmFacets;

      return {
        facets: facetsOf(stack, generation),
        fingerprint: await fingerprint(generation),
      };
    })();
    outputs.set(label, pending);
  }

  try {
    return await pending;
  } catch (error) {
    // Every caller awaiting this rejection lands here; only the first finds it still cached.
    if (outputs.get(label) === pending) {
      outputs.delete(label);
    }

    throw error;
  }
};

export const verifiedFingerprint = async (
  stack: Stack,
  packageManager: PackageManager = "pnpm"
) => {
  const output = await verifiedOutput(stack, packageManager);

  return output.fingerprint;
};

/** Whether `record` passed at the stack's current output. */
export const vouchesFor = async (
  record: StackVerification | undefined,
  stack: Stack,
  packageManager?: PackageManager
) =>
  record !== undefined &&
  record.fingerprint === (await verifiedFingerprint(stack, packageManager));

/** The record that covers the current output, under the label of the task that produced it. */
export interface VerificationMatch {
  readonly label: string;
  readonly record: StackVerification;
}

const matchOf = async (
  projection: Projection,
  stack: Stack,
  packageManager: PackageManager
): Promise<VerificationMatch | undefined> => {
  const entry =
    projection.coverage[packageManager][taskLabel(stack, packageManager)];

  if (entry === undefined) {
    return undefined;
  }

  const record = projection.linux[entry.by];

  return record !== undefined &&
    entry.fingerprint === (await verifiedFingerprint(stack, packageManager))
    ? { label: entry.by, record }
    : undefined;
};

/** A current record; Bun also needs its sources covered under pnpm. */
export const verificationOf = async (
  stack: Stack,
  addons: readonly string[],
  packageManager: PackageManager = "pnpm",
  projection: Projection = verification
): Promise<VerificationMatch | undefined> => {
  if (!defaultsCover(registry, addons)) {
    return undefined;
  }

  const subject = verifiedAs(stack);
  const sources = await matchOf(projection, subject, "pnpm");

  if (sources === undefined || packageManager !== "bun") {
    return sources;
  }

  return await matchOf(projection, subject, "bun");
};
