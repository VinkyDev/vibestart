import type { ParseError } from "jsonc-parser";
import { parse } from "jsonc-parser";

import type { FileChange } from "@vibestart/core";
import { mergeFile } from "@vibestart/core";
import { maintenanceFiles } from "@vibestart/integrations";

import { metadataFiles, readText } from "#/maintenance/files.ts";
import type { Snapshot } from "#/maintenance/model.ts";
import { MaintenanceError } from "#/maintenance/model.ts";

export interface Plan {
  readonly changes: readonly FileChange[];
  readonly conflicts: readonly FileChange[];
  readonly target: Snapshot;
}

export const planUpdate = (
  cwd: string,
  base: Snapshot | null,
  target: Snapshot
): Plan => {
  const previous = new Map(
    maintenanceFiles(base?.files ?? []).map((file) => [file.path, file])
  );
  const changes: FileChange[] = [];
  for (const file of maintenanceFiles(target.files)) {
    const before = previous.get(file.path)?.content ?? null;
    const local = readText(cwd, file.path);
    const change = mergeFile(file.path, before, local, file.content);
    // An already selected capability with missing infrastructure is damaged, not an add/no-op.
    if (local === null && before !== null && before === file.content) {
      changes.push({ ...change, after: file.content, conflict: true });
    } else if (change.before !== change.after || change.conflict) {
      changes.push(change);
    }
  }
  for (const file of metadataFiles(target)) {
    const before = readText(cwd, file.path);
    if (before !== file.content) {
      changes.push({
        after: file.content,
        before,
        conflict: false,
        path: file.path,
      });
    }
  }
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
    target,
  };
};
