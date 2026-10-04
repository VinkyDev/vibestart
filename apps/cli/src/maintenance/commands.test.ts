import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, it, vi } from "vite-plus/test";
import { z } from "zod";

import { resolve, withDefaults } from "@vibestart/core";
import { registry } from "@vibestart/integrations";

import { maintenanceCommand } from "#/maintenance/commands.ts";
import {
  initializeBaseline,
  readBaseline,
  readText,
  writeText,
} from "#/maintenance/files.ts";
import { currentSnapshot } from "#/maintenance/release.ts";
import { pendingOperation } from "#/maintenance/transaction.ts";

const roots: string[] = [];
const fixture = async (
  packageManager: "pnpm" | "bun",
  runtime: "node" | "bun"
) => {
  const cwd = mkdtempSync(path.join(tmpdir(), "vibestart-commands-"));
  roots.push(cwd);
  const [stack] = resolve(
    registry,
    withDefaults(registry, {
      framework: "spa",
      backend: "hono",
      api: "orpc",
      database: "sqlite",
      auth: null,
      runtime,
    })
  ).stacks;
  if (stack === undefined) {
    throw new Error("Expected legal stack");
  }
  const base = await currentSnapshot("business", {
    addons: [],
    channel: "recommended",
    packageManager,
    stack,
  });
  for (const file of base.files) {
    writeText(cwd, file.path, file.content);
  }
  initializeBaseline(cwd, base);
  return { base, cwd };
};

const outputSchema = z.object({
  exitCode: z.number(),
  ok: z.boolean(),
  status: z.string(),
});
const capture = async (...args: string[]) => {
  const output: string[] = [];
  const write = vi
    .spyOn(process.stdout, "write")
    .mockImplementation((chunk) => {
      output.push(String(chunk));
      return true;
    });
  let exitCode: number;
  try {
    exitCode = await maintenanceCommand(args);
  } finally {
    write.mockRestore();
  }
  return { exitCode, output: output.join("") };
};
const run = async (...args: string[]) => {
  const result = await capture(...args, "--json");
  return {
    exitCode: result.exitCode,
    output: outputSchema.parse(JSON.parse(result.output)),
  };
};

describe("project maintenance CLI", () => {
  afterAll(() => {
    for (const cwd of roots) {
      rmSync(cwd, { force: true, recursive: true });
    }
  });

  it("lists capability IDs and descriptions without requiring JSON", async () => {
    const result = await capture("add", "--list");
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain("knip — Knip");
    expect(result.output).toContain("ultracite — Ultracite");
    expect(result.output).toContain("docker — Docker");
    expect(result.output).toContain("vibestart add <id> --dry-run");
  });

  it("shows doctor findings and distinguishes an offline lookup", async () => {
    const { base, cwd } = await fixture("pnpm", "node");
    const result = await capture("doctor", "--cwd", cwd, "--offline");
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain(`Project template: ${base.version}`);
    expect(result.output).toContain("Missing pnpm-lock.yaml: run vp install");
    expect(result.output).toContain("not queried (--offline)");
  });

  it("explains deferred installation and recovery without claiming completion", async () => {
    const { cwd } = await fixture("pnpm", "node");
    const result = await capture(
      "add",
      "knip",
      "--cwd",
      cwd,
      "--yes",
      "--no-install"
    );
    expect(result.exitCode).toBe(0);
    expect(result.output).toContain(
      "Installation and checks are still pending"
    );
    expect(result.output).toContain("vibestart recover");
    expect(pendingOperation(cwd)?.phase).toBe("applied");
  });

  it("previews a conflict without writing anything", async () => {
    const { cwd } = await fixture("pnpm", "node");
    writeText(cwd, "Dockerfile", "FROM custom-business-image\n");
    const preview = await capture("add", "docker", "--cwd", cwd, "--dry-run");
    expect(preview.exitCode).toBe(1);
    expect(preview.output).toContain("Conflict: Dockerfile");
    expect(preview.output).toContain("Preview only; no files were written");
    expect(pendingOperation(cwd)).toBeNull();
  });

  it("prepares recovery candidates when a conflicting plan is applied", async () => {
    const { cwd } = await fixture("pnpm", "node");
    writeText(cwd, "Dockerfile", "FROM custom-business-image\n");
    const applied = await capture("add", "docker", "--cwd", cwd, "--yes");
    expect(applied.exitCode).toBe(1);
    expect(applied.output).toContain(".vibestart/pending/candidates");
    expect(applied.output).toContain("vibestart recover --abort");
    expect(pendingOperation(cwd)?.phase).toBe("conflicted");
  });

  it.each([
    ["pnpm", "node"],
    ["pnpm", "bun"],
    ["bun", "node"],
    ["bun", "bun"],
  ] as const)(
    "adds capabilities with %s and %s without changing business code",
    async (manager, runtime) => {
      const { cwd } = await fixture(manager, runtime);
      writeText(
        cwd,
        "apps/server/src/app.ts",
        "custom business implementation"
      );
      const result = await run(
        "add",
        "knip",
        "ultracite",
        "docker",
        "--cwd",
        cwd,
        "--yes",
        "--no-install"
      );
      expect(result.output).toMatchObject({
        ok: true,
        status: "needs-install",
      });
      expect(readBaseline(cwd).blueprint).toMatchObject({
        addons: ["knip", "ultracite"],
        packageManager: manager,
        stack: { deployment: "docker", runtime },
      });
      expect(readText(cwd, "apps/server/src/app.ts")).toBe(
        "custom business implementation"
      );
      expect(readText(cwd, "Dockerfile")).toContain("FROM");
      expect(pendingOperation(cwd)?.phase).toBe("applied");
    }
  );

  it("previews without creating pending metadata or modifying project files", async () => {
    const { base, cwd } = await fixture("bun", "bun");
    const result = await run("add", "knip", "--cwd", cwd, "--dry-run");
    expect(result.output).toMatchObject({ ok: true, status: "planned" });
    expect(readBaseline(cwd)).toStrictEqual(base);
    expect(pendingOperation(cwd)).toBeNull();
    expect(readText(cwd, ".vibestart/operation.lock")).toBeNull();
  });

  it("reports invalid flags and contradictory modes with exit 2", async () => {
    const result = await run("upgrade", "--no-install", "--full-check");
    expect(result).toMatchObject({
      exitCode: 2,
      output: { ok: false, exitCode: 2 },
    });
    const unknown = await run("upgrade", "--typo");
    expect(unknown.exitCode).toBe(2);
  });

  it("refuses applying changes without non-interactive consent", async () => {
    const { cwd } = await fixture("pnpm", "node");
    const result = await run("add", "knip", "--cwd", cwd);
    expect(result.exitCode).toBe(2);
    expect(pendingOperation(cwd)).toBeNull();
  });

  it("has a clean no-op when both source and metadata already match", async () => {
    const { cwd } = await fixture("pnpm", "node");
    const result = await run("upgrade", "--cwd", cwd, "--check");
    expect(result.output).toMatchObject({
      ok: true,
      status: "no-op",
      exitCode: 0,
    });
  });
});
