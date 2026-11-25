import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vite-plus/test";

import { compose } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { verifiedGeneration } from "#/verification.ts";

const deploy = async (
  database: string,
  overrides: Record<string, string>,
  action = "deploy"
) => {
  const stack = compose(registry, {
    auth: "better-auth",
    database,
    deployment: "cloudflare-workers",
  });

  const { files } = await verifiedGeneration(stack);
  const script = files.find((file) => file.path === "scripts/deploy.ts");

  if (script === undefined) {
    throw new Error("Alchemy must generate its deployment command");
  }

  const dir = mkdtempSync(path.join(tmpdir(), "alchemy-deploy-"));
  const windows = process.platform === "win32";

  try {
    writeFileSync(path.join(dir, "deploy.ts"), script.content);
    writeFileSync(
      path.join(dir, windows ? "vp.cmd" : "vp"),
      windows ? "@echo %*\r\n" : '#!/bin/sh\nprintf "%s\\n" "$*"\n',
      { mode: 0o755 }
    );

    return spawnSync(process.execPath, ["deploy.ts", action], {
      cwd: dir,
      encoding: "utf-8",
      env: {
        ...process.env,
        PATH: dir,
        ALCHEMY_STAGE: undefined,
        DATABASE_URL: "postgresql://app:password@host:5432/app",
        HYPERDRIVE_ID: "a".repeat(32),
        BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters",
        BETTER_AUTH_URL: undefined,
        ...overrides,
      },
    });
  } finally {
    rmSync(dir, { force: true, recursive: true });
  }
};

describe("Alchemy production deploy", () => {
  it.each(["postgres", "mysql"])(
    "checks an existing Hyperdrive ID before migrating %s",
    async (database) => {
      const result = await deploy(database, {
        HYPERDRIVE_ID: "not-a-hyperdrive-id",
      });

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "Set HYPERDRIVE_ID to a cache-disabled Hyperdrive config ID"
      );
      expect(result.stdout).toBe("");
    }
  );

  it("plans preview resources without migrating or borrowing production bindings", async () => {
    const env = {
      ALCHEMY_STAGE: "pr-42",
      PR_42_HYPERDRIVE_ID: "b".repeat(32),
      PR_42_BETTER_AUTH_SECRET: "a-separate-preview-secret-over-32-characters",
    };

    const plan = await deploy("postgres", env, "plan");
    expect(plan.status).toBe(0);
    expect(plan.stdout.trim().split(/\r?\n/u)).toStrictEqual([
      "run build",
      "exec alchemy plan --stage pr-42",
    ]);
    const apply = await deploy("postgres", env);
    expect(apply.status).toBe(1);
    expect(apply.stderr).toContain("Set DATABASE_URL");
    expect(apply.stdout).toBe("");
  });

  it("requires an explicit stage for destroy and skips builds and migrations", async () => {
    const implicit = await deploy("postgres", {}, "destroy");
    expect(implicit.status).toBe(1);
    expect(implicit.stdout).toBe("");

    const explicit = await deploy(
      "postgres",
      { ALCHEMY_STAGE: "prod" },
      "destroy"
    );

    expect(explicit.status).toBe(0);
    expect(explicit.stdout.trim()).toBe("exec alchemy destroy --stage prod");
  });

  it("rejects an invalid custom auth origin before running any command", async () => {
    const result = await deploy("postgres", {
      BETTER_AUTH_URL: "postgresql://host/app",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Set BETTER_AUTH_URL to a public HTTPS origin"
    );
    expect(result.stdout).toBe("");
  });

  it("builds, migrates and applies an unattended first deploy with the Worker auth origin", async () => {
    const result = await deploy("postgres", {});
    expect(result.status).toBe(0);
    expect(result.stdout.trim().split(/\r?\n/u)).toStrictEqual([
      "run build",
      "run db:migrate",
      "exec alchemy deploy --stage prod --yes",
    ]);
  });
});
