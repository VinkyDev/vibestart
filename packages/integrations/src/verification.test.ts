import { describe, expect, it } from "vite-plus/test";

import type { PackageManager, Stack } from "@vibestart/core";
import { defaultAddons, legalStacks } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { taskLabel } from "#/stack-label.ts";
import type { Projection, StackVerification } from "#/verification.ts";
import {
  emptyProjection,
  recordedVerification,
  verificationOf,
  verifiedAs,
  verifiedFingerprint,
} from "#/verification.ts";

// A stack verified as its Docker sibling, which another stack's record covers.
const stack = legalStacks(registry).find(
  (candidate) =>
    candidate.deployment === undefined && candidate.backend === "hono"
);

if (stack === undefined) {
  throw new Error("No Hono stack without a deployment");
}

const sibling = verifiedAs(stack);
const witness = "some-covering-stack";
const addons = defaultAddons(registry);

const recordOf = (fingerprint: string): StackVerification => ({
  environment: { arch: "x64", node: "v24.21.0", os: "linux 6.17.0" },
  fingerprint,
  seconds: 3,
  verifiedAt: "2026-10-08T00:00:00.000Z",
});

const record = recordOf("a".repeat(64));

/** A projection in which `witness` covers the sibling under each listed package manager at `fingerprint`. */
const covering = async (
  managers: readonly PackageManager[],
  fingerprintOf: (of: Stack, packageManager: PackageManager) => Promise<string>
): Promise<Projection> => {
  const projection = emptyProjection();
  projection.linux[witness] = record;

  const fingerprints = await Promise.all(
    managers.map(
      async (packageManager) => await fingerprintOf(sibling, packageManager)
    )
  );

  for (const [index, packageManager] of managers.entries()) {
    projection.coverage[packageManager][taskLabel(sibling, packageManager)] = {
      by: witness,
      fingerprint: fingerprints[index] ?? "",
    };
  }

  return projection;
};

describe(recordedVerification, () => {
  it("returns the record the projection names, including one from an earlier output", async () => {
    await expect(
      recordedVerification(
        stack,
        addons,
        "pnpm",
        await covering(["pnpm"], async () => await Promise.resolve("0"))
      )
    ).resolves.toStrictEqual({ label: witness, record });
  });
});

describe(verificationOf, () => {
  it("vouches for a stack with the record that covers its Docker sibling", async () => {
    await expect(
      verificationOf(
        stack,
        addons,
        "pnpm",
        await covering(["pnpm"], verifiedFingerprint)
      )
    ).resolves.toStrictEqual({ label: witness, record });
  });

  it("ignores coverage of an earlier output", async () => {
    await expect(
      verificationOf(
        stack,
        addons,
        "pnpm",
        await covering(["pnpm"], async () => await Promise.resolve("0"))
      )
    ).resolves.toBeUndefined();
  });

  it("ignores an add-on outside the defaults", async () => {
    await expect(
      verificationOf(
        stack,
        [...addons, "unknown"],
        "pnpm",
        await covering(["pnpm"], verifiedFingerprint)
      )
    ).resolves.toBeUndefined();
  });

  it("under Bun, needs the sources covered under pnpm as well", async () => {
    await expect(
      verificationOf(
        stack,
        addons,
        "bun",
        await covering(["bun"], verifiedFingerprint)
      )
    ).resolves.toBeUndefined();
    await expect(
      verificationOf(
        stack,
        addons,
        "bun",
        await covering(["pnpm", "bun"], verifiedFingerprint)
      )
    ).resolves.toStrictEqual({ label: witness, record });
  });
});
