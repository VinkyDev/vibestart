import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { afterAll, describe, expect, it } from "vite-plus/test";

import { saveLock } from "#/ci/locks.ts";
import { digest } from "#/ci/model.ts";
import { repoRoot } from "#/repo.ts";

mkdirSync(path.join(repoRoot, ".verification"), { recursive: true });
const root = mkdtempSync(path.join(repoRoot, ".verification", "test-lock-"));

describe("lock artifacts", () => {
  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it.each(["pnpm-lock.yaml", "bun.lock"])(
    "recreates missing artifact directories and preserves %s bytes",
    (name) => {
      const source = path.join(root, name);
      const artifact = path.join(root, name.replaceAll(".", "-"));
      const content = "resolved dependencies\r\n";
      writeFileSync(source, content);
      expect(existsSync(artifact)).toBeFalsy();
      const lock = saveLock(source, artifact);
      expect(lock).toBe(digest(content));
      expect(readFileSync(path.join(artifact, "locks", lock), "utf-8")).toBe(
        content
      );
    }
  );
});
