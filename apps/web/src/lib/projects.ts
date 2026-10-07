import type { GeneratedFile } from "@vibestart/core";

import type { Project, StackEntry } from "#/lib/project.ts";
import { projectKey } from "#/lib/project.ts";
import { verifiedAddons } from "#/lib/stack.ts";

const loaded = new Map<string, Promise<Project>>();

export const hasPreview = (
  entry: StackEntry,
  addons: readonly string[],
  packageManager: "pnpm" | "bun"
) => Object.hasOwn(entry.projects, projectKey(addons, packageManager));

export const loadProject = (
  entry: StackEntry,
  addons: readonly string[] = verifiedAddons,
  packageManager: "pnpm" | "bun" = "pnpm"
) => {
  const key = projectKey(addons, packageManager);
  const cacheKey = `${entry.label}/${key}`;
  let project = loaded.get(cacheKey);
  if (project === undefined) {
    const load = entry.projects[key];
    if (load === undefined) {
      throw new Error(`No project of ${entry.label} with add-ons ${key}`);
    }
    project = load();
    loaded.set(cacheKey, project);
  }
  return project;
};

export interface FileDelta {
  readonly added: ReadonlySet<string>;
  readonly removed: readonly GeneratedFile[];
  readonly changed: ReadonlySet<string>;
}

export const fileDelta = (from: Project, to: Project): FileDelta => {
  const before = new Map(from.files.map((file) => [file.path, file.content]));
  const after = new Set(to.files.map((file) => file.path));
  return {
    added: new Set(
      to.files.filter((file) => !before.has(file.path)).map((file) => file.path)
    ),
    changed: new Set(
      to.files
        .filter((file) => {
          const content = before.get(file.path);
          return content !== undefined && content !== file.content;
        })
        .map((file) => file.path)
    ),
    removed: from.files.filter((file) => !after.has(file.path)),
  };
};

interface TreeDirectory {
  readonly type: "directory";
  readonly name: string;
  readonly path: string;
  readonly children: readonly TreeNode[];
}

interface TreeFile {
  readonly type: "file";
  readonly name: string;
  readonly path: string;
  readonly file: GeneratedFile;
}

export type TreeNode = TreeDirectory | TreeFile;

interface MutableDirectory {
  readonly directories: Map<string, MutableDirectory>;
  readonly files: GeneratedFile[];
}

const emptyDirectory = (): MutableDirectory => ({
  directories: new Map(),
  files: [],
});

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);

const nodesOf = (directory: MutableDirectory, prefix: string): TreeNode[] => [
  ...[...directory.directories]
    .map(([name, child]): TreeDirectory => ({
      children: nodesOf(child, `${prefix}${name}/`),
      name,
      path: `${prefix}${name}`,
      type: "directory",
    }))
    .toSorted(byName),
  ...directory.files
    .map((file): TreeFile => ({
      file,
      name: file.path.slice(prefix.length),
      path: file.path,
      type: "file",
    }))
    .toSorted(byName),
];

export const fileTree = (files: readonly GeneratedFile[]): TreeNode[] => {
  const root = emptyDirectory();
  for (const file of files) {
    const segments = file.path.split("/");
    let directory = root;
    for (const segment of segments.slice(0, -1)) {
      let child = directory.directories.get(segment);
      if (child === undefined) {
        child = emptyDirectory();
        directory.directories.set(segment, child);
      }
      directory = child;
    }
    directory.files.push(file);
  }
  return nodesOf(root, "");
};
