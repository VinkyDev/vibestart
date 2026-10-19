import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vite-plus/test";

import { defaultAddons, generate, legalStacks } from "@vibestart/core";

import { materializeEnv, renderEnvFiles } from "#/env-files.ts";
import { registry } from "#/registry.ts";
import { stackLabel } from "#/stack-label.ts";

const readOf = async (label: string) => {
  const stack = legalStacks(registry).find(
    (legal) => stackLabel(legal) === label
  );

  if (stack === undefined) {
    throw new Error(`${label} is not a legal stack`);
  }

  const { read } = await generate(
    registry,
    { addons: defaultAddons(registry), channel: "recommended", stack },
    { name: "my-app" }
  );

  return read;
};

const runner = {
  authSecret: "abc123secret-is-long-enough-here",
  mongodbDatabaseUrl: "mongodb://runner/mongo",
  mysqlDatabaseUrl: "mysql://runner/my",
  postgresDatabaseUrl: "postgres://runner/pg",
};

describe(renderEnvFiles, () => {
  it.each([
    "hono-postgres-better-auth",
    "next-self-postgres-better-auth",
    "tanstack-start-self-postgres-better-auth",
  ])("leaves the example secret unset for %s", async (label) => {
    const [file] = renderEnvFiles(await readOf(label));

    expect(file?.content).toContain("BETTER_AUTH_SECRET=\n");
  });

  it("fills in the auth secret and the runner's database", async () => {
    const files = renderEnvFiles(
      await readOf("hono-postgres-better-auth"),
      runner
    );

    expect(files.map((file) => file.path)).toStrictEqual(["apps/server/.env"]);
    expect(files[0]?.content).toContain(
      "BETTER_AUTH_SECRET=abc123secret-is-long-enough-here\n"
    );
    expect(files[0]?.content).toContain("DATABASE_URL=postgres://runner/pg\n");
  });

  it.each([
    ["hono-mysql", "mysql://runner/my"],
    ["hono-mongodb", "mongodb://runner/mongo"],
  ])("points %s at the runner's server", async (label, url) => {
    const [file] = renderEnvFiles(await readOf(label), runner);

    expect(file?.content).toContain(`DATABASE_URL=${url}\n`);
  });
});

describe(materializeEnv, () => {
  let dir = "";

  afterEach(() => {
    rmSync(dir, { force: true, recursive: true });
  });

  it("writes every app's file under the project root", async () => {
    dir = mkdtempSync(path.join(tmpdir(), "vs-env-"));
    const read = await readOf("tanstack-start-hono-sqlite");

    materializeEnv(dir, read);

    for (const file of renderEnvFiles(read)) {
      expect(readFileSync(path.join(dir, file.path), "utf-8")).toBe(
        file.content
      );
    }
  });
});
