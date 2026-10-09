import { describe, expect, it } from "vite-plus/test";

import type { PackageManager, Stack } from "@vibestart/core";
import { defaultAddons, legalStacks } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { taskLabel } from "#/stack-label.ts";
import type { Projection, StackVerification } from "#/verification.ts";
import {
  bunSubjectOf,
  verificationOf,
  verifiedAs,
  verifiedFingerprint,
} from "#/verification.ts";

// A stack verified as its Docker sibling, whose Bun record comes from a third stack that covers it.
const stack = legalStacks(registry).find(
  (candidate) =>
    candidate.deployment === undefined &&
    candidate.backend === "hono" &&
    bunSubjectOf(candidate) !== verifiedAs(candidate)
);
if (stack === undefined) {
  throw new Error("No Hono stack without a deployment has another Bun subject");
}
const sibling = verifiedAs(stack);
const subject = bunSubjectOf(stack);
const addons = defaultAddons(registry);

const recordOf = (fingerprint: string): StackVerification => ({
  environment: { arch: "x64", node: "v24.21.0", os: "linux 6.17.0" },
  fingerprint,
  seconds: 3,
  verifiedAt: "2026-10-08T00:00:00.000Z",
});

const current = async (of: Stack, packageManager: PackageManager) =>
  recordOf(await verifiedFingerprint(of, packageManager));

const projectionOf = (linux: Projection["linux"]): Projection => ({
  linux,
  windows: {},
});

describe(verificationOf, () => {
  it("vouches for a stack with its Docker sibling's record", async () => {
    const record = await current(sibling, "pnpm");
    await expect(
      verificationOf(
        stack,
        addons,
        "pnpm",
        projectionOf({ [taskLabel(sibling)]: record })
      )
    ).resolves.toStrictEqual({ label: taskLabel(sibling), record });
  });

  it("ignores a record of an earlier output", async () => {
    await expect(
      verificationOf(
        stack,
        addons,
        "pnpm",
        projectionOf({ [taskLabel(sibling)]: recordOf("0".repeat(64)) })
      )
    ).resolves.toBeUndefined();
  });

  it("under Bun, takes the Bun subject's record once the pnpm record is current", async () => {
    const bun = await current(subject, "bun");
    const linux = { [taskLabel(subject, "bun")]: bun };
    await expect(
      verificationOf(stack, addons, "bun", projectionOf(linux))
    ).resolves.toBeUndefined();
    await expect(
      verificationOf(
        stack,
        addons,
        "bun",
        projectionOf({
          ...linux,
          [taskLabel(sibling)]: await current(sibling, "pnpm"),
        })
      )
    ).resolves.toStrictEqual({ label: taskLabel(subject, "bun"), record: bun });
  });
});
