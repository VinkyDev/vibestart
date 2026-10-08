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
  path: relativePath.refine((value) => !value.startsWith(".git/")),
});

/** The `snapshot` protocol's output: one release's generated files for a project. Every release reads it. */
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

const exactVersion = /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/u;
export const versionSchema = z.string().regex(exactVersion);

/** The project `vibestart.jsonc` describes: its choices, and the release and name that generated it. */
export interface Project {
  readonly blueprint: Input;
  readonly name: string;
  readonly version: string;
}

export const recordFile = "vibestart.jsonc";

const provenanceSchema = z.object({
  name: z.string({ error: 'vibestart.jsonc records no project "name".' }),
  version: z
    .string({
      error:
        'vibestart.jsonc records no "version" of the vibestart release that generated the project.',
    })
    .regex(exactVersion, {
      error: 'The "version" in vibestart.jsonc must be an exact release.',
    }),
});

type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue | undefined };
export const serialize = (value: JsonValue) =>
  `${JSON.stringify(value, null, 2)}\n`;

export const normalizeInput = (input: Blueprint) => ({
  addons: input.addons,
  channel: input.channel,
  packageManager: input.packageManager ?? "pnpm",
  stack: input.stack,
});
/** The choices a release generates from, as the `snapshot` protocol exchanges them. */
export type Input = ReturnType<typeof normalizeInput>;

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

export class MaintenanceError extends Error {
  readonly exitCode: number;
  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = "MaintenanceError";
    this.exitCode = exitCode;
  }
}

export const projectOf = (
  blueprint: Blueprint & { readonly name?: string; readonly version?: string }
): Project => {
  const provenance = provenanceSchema.safeParse(blueprint);
  if (!provenance.success) {
    throw new MaintenanceError(
      [
        ...new Set(provenance.error.issues.map((issue) => issue.message)),
        "Maintenance regenerates the original templates from them.",
      ].join("\n")
    );
  }
  return { ...provenance.data, blueprint: normalizeInput(blueprint) };
};
