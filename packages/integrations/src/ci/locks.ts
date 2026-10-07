import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { z } from "zod";

import { digest } from "#/ci/model.ts";

const resolutionSchema = z.strictObject({
  manager: z.enum(["pnpm", "bun"]),
  lockfile: z.string(),
  policy: z.string(),
});

const filesOf = (manager: "pnpm" | "bun") =>
  manager === "pnpm"
    ? { lockfile: "pnpm-lock.yaml", policy: "pnpm-workspace.yaml" }
    : { lockfile: "bun.lock", policy: "package.json" };

export const saveLock = (file: string, artifact: string) => {
  const manager = path.basename(file) === "pnpm-lock.yaml" ? "pnpm" : "bun";
  const content = JSON.stringify({
    manager,
    lockfile: readFileSync(file, "utf-8"),
    policy: readFileSync(
      path.join(path.dirname(file), filesOf(manager).policy),
      "utf-8"
    ),
  });
  const lock = digest(content);
  const dir = path.join(artifact, "locks");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, lock), content);
  return lock;
};

export const restoreLock = (
  file: string,
  directory: string,
  manager: "pnpm" | "bun"
) => {
  const resolution = resolutionSchema.parse(
    JSON.parse(readFileSync(file, "utf-8"))
  );
  if (resolution.manager !== manager) {
    throw new Error("Resolution package manager mismatch");
  }
  const files = filesOf(manager);
  writeFileSync(path.join(directory, files.lockfile), resolution.lockfile);
  writeFileSync(path.join(directory, files.policy), resolution.policy);
};
