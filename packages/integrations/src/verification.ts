import { z } from "zod";

import type {
  Blueprint,
  PackageManager,
  Stack,
  Verification,
} from "@vibestart/core";
import {
  defaultAddons,
  defaultsCover,
  fingerprint,
  generate,
  legalStacks,
  verificationSchema,
} from "@vibestart/core";

import type { Facets } from "#/coverage.ts";
import { bunFacets, pnpmFacets } from "#/coverage.ts";
import { registry } from "#/registry.ts";
import { stackLabel, taskLabel } from "#/stack-label.ts";

/** Every stack is covered on Linux; the goldens are also verified on Windows. */
export const platforms = ["linux", "windows"] as const;

export type Platform = (typeof platforms)[number];

/** For each verified stack's task label, its fingerprint when the store was read and the task whose record covers it. */
const coverageSchema = z.record(
  z.string(),
  z.strictObject({ by: z.string(), fingerprint: z.string() })
);

/** Each platform's records for the current output by task label, and the Linux tasks they cover. */
const projectionSchema = z.strictObject({
  coverage: z.strictObject({ bun: coverageSchema, pnpm: coverageSchema }),
  linux: verificationSchema,
  windows: verificationSchema,
});

export type Projection = z.infer<typeof projectionSchema>;

export const emptyProjection = (): Projection => ({
  coverage: { bun: {}, pnpm: {} },
  linux: {},
  windows: {},
});

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

export type StackVerification = Verification[string];

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

const matchRecorded = (
  projection: Projection,
  stack: Stack,
  packageManager: PackageManager
): VerificationMatch | undefined => {
  const entry =
    projection.coverage[packageManager][taskLabel(stack, packageManager)];

  const record = entry === undefined ? undefined : projection.linux[entry.by];

  return entry !== undefined && record !== undefined
    ? { label: entry.by, record }
    : undefined;
};

const matchOf = async (
  projection: Projection,
  stack: Stack,
  packageManager: PackageManager
): Promise<VerificationMatch | undefined> => {
  const entry =
    projection.coverage[packageManager][taskLabel(stack, packageManager)];

  const match = matchRecorded(projection, stack, packageManager);

  return match !== undefined &&
    entry !== undefined &&
    entry.fingerprint === (await verifiedFingerprint(stack, packageManager))
    ? match
    : undefined;
};

/** Under Bun, the record that covers its dependencies, and only when the sources are covered under pnpm. */
const verificationMatch = async (
  stack: Stack,
  addons: readonly string[],
  packageManager: PackageManager,
  projection: Projection,
  match: (
    projection: Projection,
    stack: Stack,
    packageManager: PackageManager
  ) => Promise<VerificationMatch | undefined> | VerificationMatch | undefined
): Promise<VerificationMatch | undefined> => {
  if (!defaultsCover(registry, addons)) {
    return undefined;
  }

  const subject = verifiedAs(stack);
  const sources = await match(projection, subject, "pnpm");

  if (sources === undefined || packageManager !== "bun") {
    return sources;
  }

  return await match(projection, subject, "bun");
};

/**
 * The record `pull` wrote for this stack. It names that output until the next `pull`; `verificationOf` generates
 * the stack to reject a record from an earlier one.
 */
export const recordedVerification = async (
  stack: Stack,
  addons: readonly string[],
  packageManager: PackageManager = "pnpm",
  projection: Projection = verification
) =>
  await verificationMatch(
    stack,
    addons,
    packageManager,
    projection,
    matchRecorded
  );

export const verificationOf = async (
  stack: Stack,
  addons: readonly string[],
  packageManager: PackageManager = "pnpm",
  projection: Projection = verification
) =>
  await verificationMatch(stack, addons, packageManager, projection, matchOf);
