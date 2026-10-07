import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { userInfo } from "node:os";
import path from "node:path";

import type { Generation, PackageManager, Stack } from "@vibestart/core";
import { generate } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { materializeEnvFromExamples } from "#/server-env.ts";
import { verifiedBlueprint, verifiedName } from "#/verification.ts";

export const generateProject = async (
  stack: Stack,
  packageManager?: PackageManager
) =>
  await generate(registry, verifiedBlueprint(stack, packageManager), {
    name: verifiedName,
  });

export const writeProject = (dir: string, { files }: Generation) => {
  rmSync(dir, { force: true, recursive: true });
  for (const file of files) {
    mkdirSync(path.dirname(path.join(dir, file.path)), { recursive: true });
    writeFileSync(path.join(dir, file.path), file.content);
  }
};

// A server's own `postgres` database always exists; each test run creates and drops `postgres_test_<port>` beside it.
export const postgresUrl =
  process.env.STACKS_POSTGRES_URL ??
  `postgres://${userInfo().username}@localhost:5432/postgres`;

export const writeEnvFiles = (dir: string) => {
  materializeEnvFromExamples(dir, {
    authSecret: "local-secret-that-is-at-least-32-characters",
    postgresDatabaseUrl: postgresUrl,
  });
};

// Loading the generator through Vite sets NODE_ENV=development, which breaks `next build`.
export const projectEnv = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => name !== "NODE_ENV")
);

export const logTail = (logFile: string, lines = 80) =>
  readFileSync(logFile, "utf-8").trimEnd().split("\n").slice(-lines).join("\n");

// Each stack's e2e runner takes a port for the web app and the next for a Hono server, so stacks sit 10 ports apart.
// From 20000 the range stays below the ephemeral ports of Linux (32768) and macOS (49152), which the operating system
// hands to outgoing connections, and clear of the ports `fetch` refuses.
export const testPorts = (index: number) => ({
  E2E_TEST_PORT: String(20_000 + index * 10),
});
