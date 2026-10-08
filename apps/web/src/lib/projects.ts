import { z } from "zod";

import type { GeneratedFile } from "@vibestart/core";

import type { Project, StackEntry, StackPreview } from "#/lib/project.ts";
import { previewPath, projectKey } from "#/lib/project.ts";
import { verifiedAddons } from "#/lib/stack.ts";

const previewSchema: z.ZodType<StackPreview> = z.object({
  contents: z.array(z.string()),
  projects: z.record(
    z.string(),
    z.object({
      files: z.array(
        z.object({
          content: z.int().nonnegative(),
          owner: z.string(),
          path: z.string(),
        })
      ),
      gettingStarted: z.array(
        z.object({
          note: z
            .object({
              id: z.string(),
              text: z.string(),
              values: z.record(z.string(), z.string()).optional(),
            })
            .optional(),
          run: z.string(),
        })
      ),
      packageManager: z.enum(["pnpm", "bun"]),
      setup: z.array(
        z.object({ run: z.string(), writes: z.array(z.string()) })
      ),
    })
  ),
});

const fetchPreview = async (label: string) => {
  const response = await fetch(
    `${import.meta.env.BASE_URL}${previewPath(label)}`
  );
  if (!response.ok) {
    throw new Error(`No preview of ${label}: HTTP ${response.status}`);
  }
  return previewSchema.parse(await response.json());
};

const cached = <T>(
  cache: Map<string, Promise<T>>,
  key: string,
  create: () => Promise<T>
) => {
  let promise = cache.get(key);
  if (promise === undefined) {
    promise = (async () => {
      try {
        return await create();
      } catch (error) {
        cache.delete(key);
        throw error;
      }
    })();
    cache.set(key, promise);
  }
  return promise;
};

const previews = new Map<string, Promise<StackPreview>>();

const expand = async (label: string, key: string): Promise<Project> => {
  const { contents, projects } = await cached(
    previews,
    label,
    async () => await fetchPreview(label)
  );
  const project = projects[key];
  if (project === undefined) {
    throw new Error(`No project of ${label} with add-ons ${key}`);
  }
  return {
    ...project,
    files: project.files.map((file) => {
      const content = contents[file.content];
      if (content === undefined) {
        throw new Error(`${label} ${key} ${file.path} has no content`);
      }
      return { ...file, content };
    }),
  };
};

const loaded = new Map<string, Promise<Project>>();

export const loadProject = (
  entry: StackEntry,
  addons: readonly string[] = verifiedAddons,
  packageManager: "pnpm" | "bun" = "pnpm"
) => {
  const key = projectKey(addons, packageManager);
  return cached(
    loaded,
    `${entry.label}/${key}`,
    async () => await expand(entry.label, key)
  );
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
