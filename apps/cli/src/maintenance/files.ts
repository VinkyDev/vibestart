import { randomUUID } from "node:crypto";
import {
  closeSync,
  fsyncSync,
  openSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
  chmodSync,
} from "node:fs";
import path from "node:path";

import {
  MaintenanceError,
  relativePath,
  serialize,
  snapshotSchema,
  stateOf,
  stateSchema,
  releaseId,
} from "#/maintenance/model.ts";
import type { Snapshot } from "#/maintenance/model.ts";

/** Never follow symlinks in a project's managed paths, including metadata. */
export const projectPath = (cwd: string, file: string) => {
  if (lstatSync(cwd, { throwIfNoEntry: false })?.isSymbolicLink() === true) {
    throw new MaintenanceError("Project directory must not be a symlink.");
  }
  const parts = relativePath.parse(file).split("/");
  let current = cwd;
  for (const part of parts) {
    current = path.join(current, part);
    const stats = lstatSync(current, { throwIfNoEntry: false });
    if (stats?.isSymbolicLink() === true) {
      throw new MaintenanceError(`Refusing symlink: ${file}`);
    }
  }
  return current;
};

export const readText = (cwd: string, file: string): string | null => {
  const target = projectPath(cwd, file);
  const stats = lstatSync(target, { throwIfNoEntry: false });
  if (stats === undefined) {
    return null;
  }
  if (!stats.isFile()) {
    throw new MaintenanceError(`Expected a regular file: ${file}`);
  }
  return readFileSync(target, "utf-8");
};

export const modeOf = (cwd: string, file: string) =>
  lstatSync(projectPath(cwd, file), { throwIfNoEntry: false })?.mode ?? 0o644;

export const writeText = (
  cwd: string,
  file: string,
  content: string | null,
  mode = 0o644
) => {
  const target = projectPath(cwd, file);
  if (content === null) {
    if (lstatSync(target, { throwIfNoEntry: false }) !== undefined) {
      unlinkSync(target);
    }
    return;
  }
  mkdirSync(path.dirname(target), { recursive: true });
  const temporary = `${target}.${randomUUID()}.vibestart-tmp`;
  // O_EXCL prevents a stale or malicious temporary symlink from being followed.
  const descriptor = openSync(temporary, "wx", mode);
  try {
    writeFileSync(descriptor, content);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
  chmodSync(temporary, mode);
  renameSync(temporary, target);
};

export const metadataFiles = (snapshot: Snapshot) => [
  { path: ".vibestart/base.json", content: serialize(snapshot) },
  { path: ".vibestart/state.json", content: serialize(stateOf(snapshot)) },
  {
    path: ".vibestart/.gitignore",
    content: "pending/\nbackup/\ncache/\nlast-run.json\noperation.lock\n",
  },
];

export const readBaseline = (cwd: string) => {
  const source = readText(cwd, ".vibestart/base.json");
  const stateText = readText(cwd, ".vibestart/state.json");
  if (source === null || stateText === null) {
    throw new MaintenanceError(
      "No trusted baseline. Run `vibestart adopt --from <original snapshot.json>` first."
    );
  }
  const snapshot = snapshotSchema.parse(JSON.parse(source));
  const state = stateSchema.parse(JSON.parse(stateText));
  if (
    state.release !== releaseId(snapshot) ||
    serialize(state) !== serialize(stateOf(snapshot))
  ) {
    throw new MaintenanceError(
      "Baseline and state disagree. Restore them together from Git or run recover."
    );
  }
  return snapshot;
};

export const initializeBaseline = (cwd: string, snapshot: Snapshot) => {
  for (const file of metadataFiles(snapshot)) {
    if (readText(cwd, file.path) !== null) {
      throw new MaintenanceError(`Baseline already exists: ${file.path}`);
    }
    writeText(cwd, file.path, file.content);
  }
};
