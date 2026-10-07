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

import { restoreLock, saveLock } from "#/ci/locks.ts";
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
      const manager = name === "bun.lock" ? "bun" : "pnpm";
      const policyName =
        manager === "bun" ? "package.json" : "pnpm-workspace.yaml";
      const policy =
        manager === "bun"
          ? '{"trustedDependencies":["vite-plus"]}'
          : "minimumReleaseAgeExclude:\n  - vite-plus@1.1.0\n";
      writeFileSync(path.join(root, policyName), policy);
      writeFileSync(source, content);
      expect(existsSync(artifact)).toBeFalsy();
      const lock = saveLock(source, artifact);
      const archive = path.join(artifact, "locks", lock);
      expect(digest(readFileSync(archive, "utf-8"))).toBe(lock);
      const restored = path.join(root, `restored-${manager}`);
      mkdirSync(restored, { recursive: true });
      restoreLock(archive, restored, manager);
      expect(readFileSync(path.join(restored, name), "utf-8")).toBe(content);
      expect(readFileSync(path.join(restored, policyName), "utf-8")).toBe(
        policy
      );
    }
  );
});
