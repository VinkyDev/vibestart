import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { execa } from "execa";
import { afterAll, describe, expect, it, vi } from "vite-plus/test";
import { z } from "zod";

import { resolve, withDefaults } from "@vibestart/core";
import { registry } from "@vibestart/integrations";

import { maintenanceCommand } from "#/maintenance/commands.ts";
import { readText, writeText } from "#/maintenance/files.ts";
import { projectOf } from "#/maintenance/model.ts";
import { currentSnapshot, runningVersion } from "#/maintenance/release.ts";
import { loadRecipe } from "#/stack.ts";

const roots: string[] = [];
const git = async (cwd: string, ...args: string[]) =>
  await execa(
    "git",
    ["-c", "user.name=test", "-c", "user.email=test@example.com", ...args],
    { cwd }
  );
const commit = async (cwd: string) => {
  await git(cwd, "add", "-A");
  await git(cwd, "commit", "--quiet", "--allow-empty", "-m", "edit");
};

const fixture = async (
  packageManager: "pnpm" | "bun",
  runtime: "node" | "bun",
  { repository = true } = {}
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
  if (repository) {
    await git(cwd, "init", "--quiet");
    await commit(cwd);
  }
  return { base, cwd };
};

const outputSchema = z.object({
  error: z.string().optional(),
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

  it("records the release and name that generated the project in vibestart.jsonc", async () => {
    const { cwd } = await fixture("pnpm", "node");
    await expect(loadRecipe(cwd)).resolves.toMatchObject({
      name: "business",
      version: runningVersion,
    });
  });

  it("shows doctor findings and distinguishes an offline lookup", async () => {
    const { cwd } = await fixture("pnpm", "node");
    const result = await capture("doctor", "--cwd", cwd, "--offline");
    expect(result.exitCode).toBe(1);
    expect(result.output).toContain(`Project template: ${runningVersion}`);
    expect(result.output).toContain("Missing pnpm-lock.yaml: run vp install");
    expect(result.output).toContain("not queried (--offline)");
    expect(result.output).toContain("0 to apply, 0 to port by hand");
  });

  it("names what a project without a recorded release is missing", async () => {
    const { cwd } = await fixture("pnpm", "node");
    writeText(
      cwd,
      "vibestart.jsonc",
      (readText(cwd, "vibestart.jsonc") ?? "").replace(/^.*"version".*$/mu, "")
    );
    const result = await run("doctor", "--cwd", cwd, "--offline");
    expect(result.exitCode).toBe(1);
    expect(result.output.error).toContain('records no "version"');
  });

  it("asks for an upgrade before adding to a project from another release, and offline doctor leaves it uncompared", async () => {
    const { cwd } = await fixture("pnpm", "node");
    writeText(
      cwd,
      "vibestart.jsonc",
      (readText(cwd, "vibestart.jsonc") ?? "").replace(
        `"version": "${runningVersion}"`,
        '"version": "0.0.1"'
      )
    );
    const result = await run("add", "knip", "--cwd", cwd, "--dry-run");
    expect(result.output.error).toContain("requires-upgrade");
    const doctor = await capture("doctor", "--cwd", cwd, "--offline");
    expect(doctor.output).toContain(
      "not compared (--offline; release 0.0.1 comes from npm)"
    );
  });

  it("names the installation and checks that deferred installation leaves", async () => {
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
    expect(result.output).toContain("Installation and checks were not run");
    expect(result.output).toContain(
      "vp install --no-frozen-lockfile && vp check && vp run knip"
    );
  });

  it("previews a conflict without writing anything", async () => {
    const { cwd } = await fixture("pnpm", "node");
    writeText(cwd, "Dockerfile", "FROM custom-business-image\n");
    const preview = await capture("add", "docker", "--cwd", cwd, "--dry-run");
    expect(preview.exitCode).toBe(1);
    expect(preview.output).toContain("Conflict: Dockerfile");
    expect(preview.output).toContain("Preview only; no files were written");
    expect(readText(cwd, "Dockerfile")).toBe("FROM custom-business-image\n");
  });

  it("writes both sides of a conflict into the file and skips installation", async () => {
    const { cwd } = await fixture("pnpm", "node");
    writeText(cwd, "Dockerfile", "FROM custom-business-image\n");
    await commit(cwd);
    const applied = await capture("add", "docker", "--cwd", cwd, "--yes");
    expect(applied.exitCode).toBe(1);
    expect(applied.output).toContain("Conflict: Dockerfile");
    expect(applied.output).toContain("git restore .");
    const dockerfile = readText(cwd, "Dockerfile") ?? "";
    expect(dockerfile).toContain(
      "<<<<<<< project\nFROM custom-business-image\n======="
    );
    expect(dockerfile).toContain(">>>>>>> target template");
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
      await commit(cwd);
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
      expect(projectOf(await loadRecipe(cwd))).toMatchObject({
        blueprint: {
          addons: ["knip", "ultracite"],
          packageManager: manager,
          stack: { deployment: "docker", runtime },
        },
        version: runningVersion,
      });
      expect(readText(cwd, "apps/server/src/app.ts")).toBe(
        "custom business implementation"
      );
      expect(readText(cwd, "Dockerfile")).toContain("FROM");
    }
  );

  it("previews without modifying project files", async () => {
    const { cwd } = await fixture("bun", "bun");
    const before = readText(cwd, "vibestart.jsonc");
    const result = await run("add", "knip", "--cwd", cwd, "--dry-run");
    expect(result.output).toMatchObject({ ok: true, status: "planned" });
    expect(readText(cwd, "vibestart.jsonc")).toBe(before);
    await expect(git(cwd, "status", "--porcelain")).resolves.toMatchObject({
      stdout: "",
    });
  });

  it("writes only from a clean Git worktree", async () => {
    const dirty = await fixture("pnpm", "node");
    writeText(dirty.cwd, "apps/server/src/app.ts", "uncommitted");
    const refused = await run(
      "add",
      "knip",
      "--cwd",
      dirty.cwd,
      "--yes",
      "--no-install"
    );
    expect(refused.exitCode).toBe(1);
    expect(refused.output.error).toContain("Commit or stash");
    const untracked = await fixture("pnpm", "node", { repository: false });
    const outside = await run(
      "add",
      "knip",
      "--cwd",
      untracked.cwd,
      "--yes",
      "--no-install"
    );
    expect(outside.exitCode).toBe(1);
    expect(outside.output.error).toContain("Git repository");
    expect(readText(untracked.cwd, "knip.jsonc")).toBeNull();
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
    const before = readText(cwd, "package.json");
    const result = await run("add", "knip", "--cwd", cwd);
    expect(result.exitCode).toBe(2);
    expect(readText(cwd, "package.json")).toBe(before);
  });

  it("has a clean no-op when the project matches its release, whatever comments its record carries", async () => {
    const { cwd } = await fixture("pnpm", "node");
    writeText(
      cwd,
      "vibestart.jsonc",
      `// Chosen for the business launch.\n${readText(cwd, "vibestart.jsonc") ?? ""}`
    );
    await commit(cwd);
    const result = await run("upgrade", "--cwd", cwd, "--check");
    expect(result.output).toMatchObject({
      ok: true,
      status: "no-op",
      exitCode: 0,
    });
  });
});
