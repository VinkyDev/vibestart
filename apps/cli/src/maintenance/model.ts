import { createHash } from "node:crypto";

import { z } from "zod";

import type { Blueprint, GeneratedFile } from "@vibestart/core";

// Persist historical choices without filling them from a future registry's defaults.
const inputSchema = z.strictObject({
  addons: z.array(z.string()),
  channel: z.literal("recommended"),
  packageManager: z.enum(["pnpm", "bun"]),
  stack: z.record(z.string(), z.string()),
});

export const relativePath = z
  .string()
  .min(1)
  .refine(
    (value) =>
      !value.includes("\\") &&
      !value.includes(":") &&
      value
        .split("/")
        .every((part) => part !== "" && part !== "." && part !== ".."),
    "Expected a relative file path without traversal"
  );

const fileSchema = z.strictObject({
  content: z.string(),
  owner: z.string(),
  path: relativePath.refine(
    (value) => !value.startsWith(".vibestart/") && !value.startsWith(".git/")
  ),
});

export const snapshotSchema = z.strictObject({
  blueprint: inputSchema,
  files: z
    .array(fileSchema)
    .refine(
      (files) => new Set(files.map((file) => file.path)).size === files.length,
      "Duplicate paths"
    ),
  name: z.string(),
  schemaVersion: z.literal(1),
  version: z.string(),
});
export type Snapshot = z.infer<typeof snapshotSchema>;

export const hash = (content: string) =>
  createHash("sha256").update(content).digest("hex");
type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue | undefined };
export const serialize = (value: JsonValue) =>
  `${JSON.stringify(value, null, 2)}\n`;
export const releaseId = (snapshot: Snapshot) =>
  `${snapshot.version}:${hash(serialize(snapshot))}`;

export const normalizeInput = (input: Blueprint) => ({
  addons: input.addons,
  channel: input.channel,
  packageManager: input.packageManager ?? "pnpm",
  stack: input.stack,
});

export const snapshotOf = (
  version: string,
  name: string,
  blueprint: Blueprint,
  files: readonly GeneratedFile[]
): Snapshot =>
  snapshotSchema.parse({
    blueprint: normalizeInput(blueprint),
    files,
    name,
    schemaVersion: 1,
    version,
  });

export const stateSchema = z.strictObject({
  blueprint: inputSchema,
  files: z.array(
    z.strictObject({ hash: z.string(), owner: z.string(), path: relativePath })
  ),
  name: z.string(),
  release: z.string(),
  schemaVersion: z.literal(1),
  version: z.string(),
});

export const stateOf = (snapshot: Snapshot) => ({
  blueprint: snapshot.blueprint,
  files: snapshot.files.map(({ content, owner, path }) => ({
    hash: hash(content),
    owner,
    path,
  })),
  name: snapshot.name,
  release: releaseId(snapshot),
  schemaVersion: 1,
  version: snapshot.version,
});

export class MaintenanceError extends Error {
  readonly exitCode: number;
  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "MaintenanceError";
    this.exitCode = exitCode;
  }
}
