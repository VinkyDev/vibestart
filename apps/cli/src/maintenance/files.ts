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

import { MaintenanceError, relativePath } from "#/maintenance/model.ts";

/** Never follow symlinks in a project's managed paths. */
const projectPath = (cwd: string, file: string) => {
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
