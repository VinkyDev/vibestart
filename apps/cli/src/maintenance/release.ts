import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";

import { execa } from "execa";
import { z } from "zod";

import { createBlueprintSchema, generate } from "@vibestart/core";
import type { Blueprint } from "@vibestart/core";
import { registry } from "@vibestart/integrations";

import type { Snapshot } from "#/maintenance/model.ts";
import {
  MaintenanceError,
  normalizeInput,
  serialize,
  snapshotOf,
  snapshotSchema,
} from "#/maintenance/model.ts";

import packageJson from "../../package.json";

export const currentSnapshot = async (name: string, input: Blueprint) => {
  const blueprint = createBlueprintSchema(registry).parse(input);
  const generation = await generate(registry, blueprint, { name });
  return snapshotOf(packageJson.version, name, blueprint, generation.files);
};

const versionSchema = z.string().regex(/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/u);

/** Execute the requested immutable release's generator, never mix its catalog with our templates. */
export const targetSnapshot = async (base: Snapshot, version?: string) => {
  if (version === undefined || version === packageJson.version) {
    return await currentSnapshot(base.name, base.blueprint);
  }
  if (!versionSchema.safeParse(version).success) {
    throw new MaintenanceError(
      "--to expects an exact version, such as 1.2.3 or 1.2.3-beta.1.",
      2
    );
  }
  const result = await execa(
    "npm",
    [
      "exec",
      "--yes",
      `--package=vibestart-cli@${version}`,
      "--",
      "vibestart",
      "snapshot",
      "--json",
    ],
    {
      cwd: tmpdir(),
      input: JSON.stringify({ blueprint: base.blueprint, name: base.name }),
      reject: false,
    }
  );
  if (result.failed) {
    throw new MaintenanceError(
      `Release ${version} could not export a baseline: ${result.stderr}`
    );
  }
  const snapshot = snapshotSchema.parse(JSON.parse(result.stdout));
  if (snapshot.version !== version || snapshot.name !== base.name) {
    throw new MaintenanceError(
      "Requested release returned a different identity."
    );
  }
  if (
    serialize(normalizeInput(snapshot.blueprint)) !==
    serialize(normalizeInput(base.blueprint))
  ) {
    throw new MaintenanceError(
      "Target release changed historical choices without a migration."
    );
  }
  return snapshot;
};

export const readSnapshot = (file: string) =>
  snapshotSchema.parse(JSON.parse(readFileSync(file, "utf-8")));

export const latestVersion = async () => {
  const response = await fetch("https://registry.npmjs.org/vibestart/latest", {
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) {
    return null;
  }
  return z.object({ version: versionSchema }).parse(await response.json())
    .version;
};

const sources = (snapshot: Snapshot) =>
  new Map(
    snapshot.files
      .filter(({ path }) => /\/src\/.*\.[cm]?[jt]sx?$/u.test(path))
      .map(({ path, content }) => [path, content])
  );
/** Source additions and removals can change application contracts as much as edits do. */
export const assertSourceCompatible = (base: Snapshot, target: Snapshot) => {
  const before = sources(base);
  const after = sources(target);
  const changed = [...new Set([...before.keys(), ...after.keys()])].filter(
    (path) => before.get(path) !== after.get(path)
  );
  if (changed.length > 0) {
    throw new MaintenanceError(
      `requires-migration: this release changes starter source: ${changed.join(", ")}. A reviewed source migration is required before advancing the baseline.`
    );
  }
};
