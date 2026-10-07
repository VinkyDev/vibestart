import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { digest } from "#/ci/model.ts";

export const saveLock = (file: string, artifact: string) => {
  const content = readFileSync(file, "utf-8");
  const lock = digest(content);
  const dir = path.join(artifact, "locks");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, lock), content);
  return lock;
};
