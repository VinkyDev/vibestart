import { createHash } from "node:crypto";

import { z } from "zod";

import type { Generation } from "@vibestart/core";
import { verificationSchema } from "@vibestart/core";

export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");

const hash = z.string().regex(/^[a-f\d]{64}$/u);
const label = z.string().regex(/^[a-z\d][a-z\d.-]*$/u);
const platformSchema = z.enum(["ubuntu-24.04", "windows-2025"]);

const taskSchema = z.strictObject({
  id: label,
  label,
  platform: platformSchema,
  input: hash,
  dependencies: hash,
  fingerprint: hash,
  lock: hash.optional(),
});

const resultSchema = taskSchema.extend({
  lock: hash,
  key: hash,
  record: verificationSchema.valueType,
  image: z.string(),
  source: z.strictObject({
    run: z.string(),
    attempt: z.string(),
    sha: z.string(),
    job: z.string(),
  }),
});

export const reportSchema = z.strictObject({
  version: z.literal(1),
  results: z.array(resultSchema),
  failed: z.array(
    z.strictObject({ id: label, input: hash, at: z.iso.datetime() })
  ),
});

export const planSchema = z.strictObject({
  createdAt: z.iso.datetime(),
  tasks: z.array(taskSchema),
  reused: z.array(resultSchema),
  batches: z.array(
    z.strictObject({
      name: label,
      platform: platformSchema,
      tasks: z.array(label).min(1),
    })
  ),
});

export type Task = z.infer<typeof taskSchema>;
export type Result = z.infer<typeof resultSchema>;
export type Plan = z.infer<typeof planSchema>;

export const runtimeInput = ({
  files,
  setup,
}: Pick<Generation, "files" | "setup">) => ({
  files: files
    .filter((file) => !/(?:^|\/)(?:README|AGENTS)\.md$/u.test(file.path))
    .map(({ path, content }) => ({ path, content })),
  setup,
});

export const dependencyInput = ({ files }: Pick<Generation, "files">) =>
  files.filter(({ path }) =>
    /(?:^|\/)(?:package\.json|pnpm-workspace\.yaml|\.npmrc|bunfig\.toml)$/u.test(
      path
    )
  );

export const reusable = (task: Task, result: Result, now: number) =>
  task.id === result.id &&
  task.input === result.input &&
  task.platform === result.platform &&
  task.label === result.label &&
  result.key === digest(`${result.input}:${result.lock}`) &&
  Date.parse(result.record.verifiedAt) <= now &&
  now - Date.parse(result.record.verifiedAt) < 7 * 24 * 60 * 60 * 1000;

export const batchesOf = (tasks: readonly Task[]) =>
  platformSchema.options.flatMap((platform) => {
    const selected = tasks.filter((task) => task.platform === platform);
    const count = Math.min(
      selected.length,
      platform === "windows-2025" ? 2 : 8
    );
    return Array.from({ length: count }, (_entry, index) => ({
      name: `${platform}-${index}`,
      platform,
      tasks: selected
        .filter((_, order) => order % count === index)
        .map(({ id }) => id),
    }));
  });

export const completedResults = (plan: Plan, results: readonly Result[]) => {
  if (
    results.some((result) => !plan.tasks.some((task) => task.id === result.id))
  ) {
    throw new Error("Unexpected verification result");
  }
  return plan.tasks.map((task) => {
    const matches = results.filter((result) => result.id === task.id);
    const [result] = matches;
    if (
      matches.length !== 1 ||
      result === undefined ||
      result.input !== task.input ||
      result.platform !== task.platform ||
      result.label !== task.label ||
      (task.lock !== undefined && result.lock !== task.lock) ||
      result.fingerprint !== task.fingerprint ||
      result.record.fingerprint !== task.fingerprint ||
      result.key !== digest(`${result.input}:${result.lock}`)
    ) {
      throw new Error(
        `Missing, duplicate or mismatched verification: ${task.id}`
      );
    }
    return result;
  });
};

export const superseded = (
  result: Result,
  failed: z.infer<typeof reportSchema>["failed"]
) =>
  failed.some(
    (failure) =>
      failure.id === result.id &&
      failure.input === result.input &&
      failure.at >= result.record.verifiedAt
  );
