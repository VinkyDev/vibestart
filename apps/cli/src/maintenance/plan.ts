import { isDeepStrictEqual } from "node:util";

import type { ParseError } from "jsonc-parser";
import { parse } from "jsonc-parser";
import { z } from "zod";

import type { FileChange } from "@vibestart/core";
import { mergeFile } from "@vibestart/core";
import { maintenanceFiles } from "@vibestart/integrations";

import { readText } from "#/maintenance/files.ts";
import type { Snapshot } from "#/maintenance/model.ts";
import { MaintenanceError, recordFile } from "#/maintenance/model.ts";

/** How the template itself changed a file: from the previous template to the target. */
type TemplateChange = Pick<FileChange, "path" | "before" | "after">;

export interface Plan {
  readonly changes: readonly FileChange[];
  readonly conflicts: readonly FileChange[];
  /** Template changes to files the project owns, such as starter source. Reported, never written. */
  readonly manual: readonly TemplateChange[];
  readonly target: Snapshot;
}

const contents = (snapshot: Snapshot) =>
  new Map(snapshot.files.map((file) => [file.path, file.content]));

export const planUpdate = (
  cwd: string,
  base: Snapshot,
  target: Snapshot
): Plan => {
  const previous = contents(base);
  const next = contents(target);
  const maintained = new Set(
    maintenanceFiles([...target.files, ...base.files]).map(({ path }) => path)
  );
  const changes: FileChange[] = [];
  for (const path of maintained) {
    const before = previous.get(path) ?? null;
    const after = next.get(path) ?? null;
    const local = readText(cwd, path);
    const change = mergeFile(path, before, local, after);
    // An already selected capability with missing infrastructure is damaged, not an add/no-op.
    if (local === null && before !== null && before === after) {
      changes.push({ ...change, after, conflict: true });
    } else if (change.before !== change.after || change.conflict) {
      changes.push(change);
    }
  }
  const targetRecord = next.get(recordFile) ?? "";
  const recorded: unknown = parse(targetRecord);
  if (
    !z.object({ version: z.literal(target.version) }).safeParse(recorded)
      .success
  ) {
    throw new MaintenanceError(
      `Release ${target.version} does not record its version in ${recordFile}, so later upgrades could not find their base; choose a later release.`
    );
  }
  const record = readText(cwd, recordFile);
  // Comments and formatting are the project's; only a change to the recorded data is written.
  if (!isDeepStrictEqual(parse(record ?? ""), recorded)) {
    changes.push({
      after: targetRecord,
      before: record,
      conflict: false,
      path: recordFile,
    });
  }
  const manual = [...new Set([...previous.keys(), ...next.keys()])]
    .filter((path) => !maintained.has(path) && path !== recordFile)
    .flatMap((path) => {
      const before = previous.get(path) ?? null;
      const after = next.get(path) ?? null;
      return before === after || readText(cwd, path) === after
        ? []
        : [{ after, before, path }];
    })
    .toSorted((a, b) => (a.path < b.path ? -1 : 1));
  for (const change of changes) {
    if (
      change.conflict ||
      change.after === null ||
      !/\.jsonc?$/u.test(change.path)
    ) {
      continue;
    }
    const errors: ParseError[] = [];
    parse(change.after, errors, { allowTrailingComma: true });
    if (errors.length > 0) {
      throw new MaintenanceError(
        `Merge would produce invalid JSONC: ${change.path}`
      );
    }
  }
  return {
    changes,
    conflicts: changes.filter((change) => change.conflict),
    manual,
    target,
  };
};
