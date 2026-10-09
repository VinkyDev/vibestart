import { minBy } from "es-toolkit/array";
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

import { registry } from "#/registry.ts";
import { stackLabel, taskLabel } from "#/stack-label.ts";

/** Every stack is verified on Linux; the goldens also on Windows. */
export const platforms = ["linux", "windows"] as const;

export type Platform = (typeof platforms)[number];

/** Each platform's records for the current output, by stack label. */
const projectionSchema = z.strictObject({
  linux: verificationSchema,
  windows: verificationSchema,
});

export type Projection = z.infer<typeof projectionSchema>;

/** `vp run stacks pull` writes this from the verification store; a checkout without it verifies nothing. */
const projections = import.meta.glob("../verification.json", {
  eager: true,
  import: "default",
});

/** Templates are files of a project with this name, so stacks are verified under it. */
export const verifiedName = "my-app";

export const verification = projectionSchema.parse(
  projections["../verification.json"] ?? { linux: {}, windows: {} }
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

/** The runtime picks the server's dependencies, so it must match. */
const covers = (whole: Stack, part: Stack) =>
  part.runtime === whole.runtime &&
  Object.entries(part).every(([kind, id]) => whole[kind] === id);

/** Stacks no other verified stack covers; Bun and pnpm generate the same sources (bun.test.ts). */
export const bunSubjects = verifiedStacks.filter(
  (stack) =>
    !verifiedStacks.some((other) => other !== stack && covers(other, stack))
);

export const bunSubjectOf = (stack: Stack): Stack => {
  const subject = verifiedAs(stack);
  const subjects = bunSubjects.filter((candidate) =>
    covers(candidate, subject)
  );
  return (
    minBy(subjects, (candidate) => Object.keys(candidate).length) ?? subject
  );
};

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

/** A label names one output, so each is generated and fingerprinted once; a generation is too large to keep. */
const fingerprints = new Map<string, Promise<string>>();

export const verifiedFingerprint = async (
  stack: Stack,
  packageManager: PackageManager = "pnpm"
) => {
  const label = taskLabel(stack, packageManager);
  let pending = fingerprints.get(label);
  if (pending === undefined) {
    pending = (async () =>
      await fingerprint(await verifiedGeneration(stack, packageManager)))();
    fingerprints.set(label, pending);
  }
  return await pending;
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

/** The record that matches the current output, under the label of the task that produced it. */
export interface VerificationMatch {
  readonly label: string;
  readonly record: StackVerification;
}

const matchOf = async (
  projection: Projection,
  subject: Stack,
  packageManager: PackageManager
): Promise<VerificationMatch | undefined> => {
  const label = taskLabel(subject, packageManager);
  const record = projection.linux[label];
  return record !== undefined &&
    (await vouchesFor(record, subject, packageManager))
    ? { label, record }
    : undefined;
};

/** Under Bun, the record that installed the dependencies, and only when the pnpm record is current. */
export const verificationOf = async (
  stack: Stack,
  addons: readonly string[],
  packageManager: PackageManager = "pnpm",
  projection: Projection = verification
): Promise<VerificationMatch | undefined> => {
  if (!defaultsCover(registry, addons)) {
    return undefined;
  }
  const sources = await matchOf(projection, verifiedAs(stack), "pnpm");
  if (sources === undefined || packageManager !== "bun") {
    return sources;
  }
  return await matchOf(projection, bunSubjectOf(stack), "bun");
};
