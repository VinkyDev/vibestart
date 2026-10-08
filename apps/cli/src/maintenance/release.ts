import { tmpdir } from "node:os";

import { execa } from "execa";
import { z } from "zod";

import { createBlueprintSchema, generate } from "@vibestart/core";
import { registry } from "@vibestart/integrations";

import type { Input, Project, Snapshot } from "#/maintenance/model.ts";
import {
  MaintenanceError,
  serialize,
  snapshotOf,
  snapshotSchema,
  versionSchema,
} from "#/maintenance/model.ts";

import packageJson from "../../package.json";

export const runningVersion = packageJson.version;

export const currentSnapshot = async (name: string, input: Input) => {
  const blueprint = createBlueprintSchema(registry).parse(input);
  const generation = await generate(registry, blueprint, {
    name,
    version: runningVersion,
  });
  return snapshotOf(runningVersion, name, blueprint, generation.files);
};

/** A release's `snapshot` output, accepted only as the files it generated for exactly this project. */
export const verifiedSnapshot = (
  output: string,
  version: string,
  { blueprint, name }: Pick<Project, "blueprint" | "name">
) => {
  const snapshot = snapshotSchema.parse(JSON.parse(output));
  if (snapshot.version !== version || snapshot.name !== name) {
    throw new MaintenanceError(
      "Requested release returned a different identity."
    );
  }
  if (serialize(snapshot.blueprint) !== serialize(blueprint)) {
    throw new MaintenanceError(
      `Release ${version} changed the project's choices without a migration.`
    );
  }
  return snapshot;
};

/**
 * A release's generated files for the project's name and choices. Generation is deterministic and npm
 * releases are immutable, so this reproduces what the release wrote. Execute the requested release's
 * own generator, never mix its catalog with our templates.
 */
export const snapshotAt = async (
  version: string,
  { blueprint, name }: Pick<Project, "blueprint" | "name">
): Promise<Snapshot> => {
  if (version === runningVersion) {
    return await currentSnapshot(name, blueprint);
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
      input: JSON.stringify({ blueprint, name }),
      reject: false,
    }
  );
  if (result.failed) {
    throw new MaintenanceError(
      `Release ${version} could not export its templates: ${result.stderr}`
    );
  }
  return verifiedSnapshot(result.stdout, version, { blueprint, name });
};

export const latestVersion = async () => {
  const response = await fetch(
    "https://registry.npmjs.org/vibestart-cli/latest",
    { signal: AbortSignal.timeout(8000) }
  );
  if (!response.ok) {
    return null;
  }
  return z.object({ version: versionSchema }).parse(await response.json())
    .version;
};
