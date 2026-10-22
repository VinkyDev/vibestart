import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vite-plus/test";

import { compose } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { verifiedGeneration } from "#/verification.ts";

// A first deploy must reject an unbound Hyperdrive before production migrations run.
describe("Void deployment prerequisites", () => {
  it.each(["postgres", "mysql"])(
    "requires a provisioned Hyperdrive for %s before migrating",
    async (database) => {
      const stack = compose(registry, { database, deployment: "void" });
      const { files } = await verifiedGeneration(stack);
      const script = files.find((file) => file.path === "scripts/deploy.ts");

      if (script === undefined) {
        throw new Error("Void must generate its deployment command");
      }

      const dir = mkdtempSync(path.join(tmpdir(), "void-deploy-"));

      try {
        writeFileSync(path.join(dir, "deploy.ts"), script.content);

        for (const id of ["", "not-a-hyperdrive-id"]) {
          const result = spawnSync(process.execPath, ["deploy.ts"], {
            cwd: dir,
            encoding: "utf-8",
            env: {
              ...process.env,
              DATABASE_URL: "postgresql://user:password@host:5432/app",
              HYPERDRIVE_ID: id,
            },
          });

          expect(result.status).toBe(1);
          expect(result.stderr).toContain(
            "Set HYPERDRIVE_ID to a cache-disabled Hyperdrive config ID"
          );
          expect(result.stdout).toBe("");
        }
      } finally {
        rmSync(dir, { force: true, recursive: true });
      }
    }
  );
});
