import { minBy } from "es-toolkit/array";
import { z } from "zod";

import type { Blueprint, PackageManager, Stack } from "@vibestart/core";
import {
  defaultAddons,
  fingerprint,
  generate,
  legalStacks,
  verificationSchema,
} from "@vibestart/core";

import { registry } from "#/registry.ts";
import { stackLabel } from "#/stack-label.ts";

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

const currentRecord = async (
  subject: Stack,
  packageManager: PackageManager
) => {
  const record =
    verification.linux[
      `${stackLabel(subject)}${packageManager === "bun" ? "-bun-pm" : ""}`
    ];
  if (record === undefined) {
    return record;
  }
  const generation = await generate(
    registry,
    verifiedBlueprint(subject, packageManager),
    { name: verifiedName }
  );
  return record.fingerprint === (await fingerprint(generation))
    ? record
    : undefined;
};

/** Any default add-on subset shares the record; under Bun, the record that installed the dependencies. */
export const verificationOf = async (
  stack: Stack,
  addons: readonly string[],
  packageManager: PackageManager = "pnpm"
) => {
  const defaults = defaultAddons(registry);
  const sources = addons.every((id) => defaults.includes(id))
    ? await currentRecord(verifiedAs(stack), "pnpm")
    : undefined;
  return packageManager === "bun" && sources !== undefined
    ? await currentRecord(bunSubjectOf(stack), "bun")
    : sources;
};
