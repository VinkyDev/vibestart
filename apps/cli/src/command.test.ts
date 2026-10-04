import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { runCommand } from "citty";
import { afterAll, describe, expect, vi, it } from "vite-plus/test";
import { z } from "zod";

import { legalStacks, verificationSchema } from "@vibestart/core";
import { registry } from "@vibestart/integrations";

import { command } from "#/command.ts";

const restApi = [
  "--frontend",
  "none",
  "--api",
  "openapi",
  "--database",
  "sqlite",
  "--auth",
  "none",
];

const failureSchema = z.object({ error: z.object({ message: z.string() }) });

const run = async (...rawArgs: string[]) => {
  const writes: string[] = [];
  const write = vi
    .spyOn(process.stdout, "write")
    .mockImplementation((chunk: string | Uint8Array) => {
      writes.push(String(chunk));
      return true;
    });
  try {
    await runCommand(command, { rawArgs: [...rawArgs, "--json"] });
  } finally {
    write.mockRestore();
  }
  const { exitCode } = process;
  process.exitCode = undefined;
  const output: unknown = JSON.parse(writes.join(""));
  const failure = failureSchema.safeParse(output);
  return {
    exitCode,
    message: failure.success ? failure.data.error.message : undefined,
    output,
  };
};

const previewSchema = z.object({
  files: z.array(z.object({ path: z.string() })),
});

const dryRunPaths = async (directory: string, ...flags: string[]) => {
  const { output } = await run(directory, ...restApi, ...flags, "--dry-run");
  return previewSchema.parse(output).files.map((file) => file.path);
};

describe("--list", () => {
  it("lists every kind and legal stack with current verification metadata", async () => {
    const { exitCode, output } = await run("--list");
    expect(exitCode).toBe(0);
    expect(output).toHaveProperty("ok", true);
    expect(output).toHaveProperty("kinds.length", registry.kinds.length);
    expect(output).toHaveProperty(
      "stacks.length",
      legalStacks(registry).length
    );
    const listing = z.object({
      stacks: z.array(z.object({ verifiedAt: z.iso.datetime().nullable() })),
    });
    expect(listing.safeParse(output).success).toBeTruthy();
  });
});

describe("choosing a stack", () => {
  it("names the kinds left to decide, with their flags", async () => {
    const { exitCode, output } = await run("app", "--framework", "next");
    expect(exitCode).toBe(1);
    expect(output).toMatchObject({
      error: {
        code: "incomplete-stack",
        open: [
          { flags: ["--backend hono", "--backend self"] },
          { kind: "api" },
          { flags: ["--auth better-auth", "--auth none"] },
        ],
      },
      ok: false,
    });
    expect(output).toHaveProperty("error.open.length", 3);
  });

  it("explains an illegal stack and offers the smallest fixes as flags", async () => {
    const { exitCode, output } = await run(
      "app",
      "--frontend",
      "none",
      "--api",
      "openapi",
      "--auth",
      "better-auth",
      "--database",
      "none"
    );
    expect(exitCode).toBe(1);
    expect(output).toMatchObject({
      error: {
        code: "illegal-stack",
        fixes: [
          { flags: ["--database postgres"] },
          { flags: ["--database sqlite"] },
          { flags: ["--auth none"] },
        ],
        violations: [{ integration: "drizzle", type: "missing-capability" }],
      },
    });
  });

  it("rejects an unknown option and an unknown value", async () => {
    const typo = await run("--databse", "sqlite");
    expect(typo).toMatchObject({
      exitCode: 1,
      output: { error: { code: "invalid-option" } },
    });
    expect(typo.message).toContain("Unknown option --databse.");

    const unknown = await run("--database", "mysql");
    expect(unknown.exitCode).toBe(1);
    expect(unknown.message).toContain(
      '--database is one of postgres, sqlite, none; got "mysql"'
    );
  });

  it("rejects an add-on the registry does not offer", async () => {
    const { exitCode, message } = await run("--addons", "knip,eslint");
    expect(exitCode).toBe(1);
    expect(message).toContain(
      '--addons takes knip, ultracite, or none; got "eslint"'
    );
  });
});

describe("package manager and runtime flags", () => {
  it("defaults to pnpm and Node", async () => {
    const defaults = await run("default-api", ...restApi, "--dry-run");
    expect(defaults.output).toMatchObject({
      packageManager: "pnpm",
      stack: { runtime: "node" },
    });
  });

  it.each(
    ["pnpm", "bun"].flatMap((packageManager) =>
      ["node", "bun"].map((runtime) => ({ packageManager, runtime }))
    )
  )(
    "$packageManager installs and $runtime runs Hono",
    async ({ packageManager, runtime }) => {
      const result = await run(
        "bun-api",
        ...restApi,
        "--package-manager",
        packageManager,
        "--runtime",
        runtime,
        "--dry-run"
      );
      expect(result.output).toMatchObject({
        ok: true,
        packageManager,
        stack: { runtime },
      });
    }
  );

  it("rejects Bun without Hono and unknown package managers", async () => {
    const unsupported = await run(
      "api",
      "--framework",
      "next",
      "--backend",
      "self",
      "--runtime",
      "bun",
      "--dry-run"
    );
    expect(unsupported.output).toMatchObject({
      ok: false,
      error: { code: "illegal-stack" },
    });
    const unknown = await run("--package-manager", "yarn");
    expect(unknown.output).toMatchObject({
      ok: false,
      error: { code: "invalid-option" },
    });
  });
});

describe("creating a project", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "vibestart-"));
  const directory = path.join(root, "my-api");

  afterAll(async () => {
    await rm(root, { force: true, recursive: true });
  });

  it("a dry run resolves the stack and lists the files, writing nothing", async () => {
    const { exitCode, output } = await run(directory, ...restApi, "--dry-run");
    expect(exitCode).toBe(0);
    expect(output).toMatchObject({
      dryRun: true,
      label: "hono-openapi-sqlite",
      project: { directory, name: "my-api" },
      steps: [],
    });
    expect(
      z
        .object({ verification: verificationSchema.valueType.nullable() })
        .safeParse(output).success
    ).toBeTruthy();
    expect(
      z
        .object({
          files: z.array(z.object({ owner: z.string(), path: z.string() })),
        })
        .parse(output).files
    ).toContainEqual({ owner: "core", path: "vibestart.jsonc" });
    await expect(
      readFile(path.join(directory, "vibestart.jsonc"))
    ).rejects.toThrow("ENOENT");
  });

  it("writes the project, then refuses to write over it", async () => {
    const created = await run(
      directory,
      ...restApi,
      "--no-install",
      "--no-git"
    );
    expect(created).toMatchObject({
      exitCode: 0,
      output: {
        nextSteps: [
          { run: `cd ${path.relative(process.cwd(), directory)}` },
          { run: "vp install" },
          { run: "vp run db:generate --name init" },
          { note: "creates apps/server/local.db", run: "vp run db:migrate" },
          { run: "vp run dev" },
        ],
        ok: true,
      },
    });
    await expect(
      readFile(path.join(directory, "vibestart.jsonc"), "utf-8")
    ).resolves.toContain('"backend": "hono",');
    await expect(
      run(directory, ...restApi, "--no-install")
    ).resolves.toMatchObject({
      exitCode: 1,
      output: { error: { code: "directory-not-empty", directory } },
    });
  });

  it("deploys with Docker only when asked", async () => {
    const target = path.join(root, "deployed");
    await expect(dryRunPaths(target)).resolves.not.toContain("Dockerfile");
    await expect(
      dryRunPaths(target, "--deployment", "docker")
    ).resolves.toContain("Dockerfile");
  });

  it("wraps a single-page app in Electron only when asked", async () => {
    const target = path.join(root, "desktop");
    const spaFlags = [
      "--framework",
      "spa",
      "--backend",
      "hono",
      "--api",
      "orpc",
      "--database",
      "postgres",
      "--auth",
      "better-auth",
    ];
    const { output } = await run(
      target,
      ...spaFlags,
      "--desktop",
      "electron",
      "--dry-run"
    );
    expect(previewSchema.parse(output).files).toContainEqual({
      path: "apps/desktop/package.json",
    });
    expect(output).toMatchObject({
      label: "spa-hono-orpc-postgres-better-auth-electron",
      ok: true,
    });
    await expect(
      run(target, "--framework", "next", "--desktop", "electron", "--dry-run")
    ).resolves.toMatchObject({ exitCode: 1, output: { ok: false } });
    await expect(dryRunPaths(target)).resolves.not.toContain(
      "apps/desktop/package.json"
    );
  });

  it("takes the default add-ons unless told otherwise, and stays verified without them", async () => {
    const target = path.join(root, "addons");
    const defaults = await run(target, ...restApi, "--dry-run");
    expect(defaults.output).toMatchObject({
      addons: ["knip", "ultracite"],
      ok: true,
    });
    const ultracite = await run(
      target,
      ...restApi,
      "--addons",
      "ultracite",
      "--dry-run"
    );
    expect(ultracite.output).toMatchObject({ addons: ["ultracite"], ok: true });
    const knip = await run(target, ...restApi, "--addons", "knip", "--dry-run");
    expect(knip.output).toMatchObject({ addons: ["knip"], ok: true });
    const { output } = await run(
      target,
      ...restApi,
      "--addons",
      "none",
      "--dry-run"
    );
    expect(output).toMatchObject({ addons: [], ok: true });
    const result = z.object({ verification: z.unknown() });
    expect(result.parse(output).verification).toStrictEqual(
      result.parse(defaults.output).verification
    );
  });

  it("imports a project's blueprint as a recipe", async () => {
    const { output } = await run(
      path.join(root, "copy"),
      "--recipe",
      directory,
      "--dry-run"
    );
    expect(output).toMatchObject({ label: "hono-openapi-sqlite", ok: true });
  });
});
