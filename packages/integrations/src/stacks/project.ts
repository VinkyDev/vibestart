import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { userInfo } from "node:os";
import path from "node:path";

import type { Generation } from "@vibestart/core";

import { materializeEnv } from "#/env-files.ts";

export const writeProject = (dir: string, { files }: Generation) => {
  rmSync(dir, { force: true, recursive: true });

  for (const file of files) {
    mkdirSync(path.dirname(path.join(dir, file.path)), { recursive: true });
    writeFileSync(path.join(dir, file.path), file.content);
  }
};

export const print = (line: string) => {
  process.stdout.write(`${line}\n`);
};

// A server's own `postgres` database always exists; each test file creates and drops a randomly named `postgres_test_…` database beside it.
const postgresUrl =
  process.env.STACKS_POSTGRES_URL ??
  `postgres://${userInfo().username}@localhost:5432/postgres`;

// A server's own `mysql` database always exists, like Postgres's `postgres`.
const mysqlUrl =
  process.env.STACKS_MYSQL_URL ?? "mysql://root:mysql@localhost:3306/mysql";

// MongoDB creates a database on its first write, so any name serves; each test file adds a suffix to it.
const mongodbUrl =
  process.env.STACKS_MONGODB_URL ?? "mongodb://localhost:27017/stacks";

export const serverUrls = {
  mongodb: mongodbUrl,
  mysql: mysqlUrl,
  postgres: postgresUrl,
} as const;

export const writeEnvFiles = (dir: string, generation: Generation) => {
  materializeEnv(dir, generation.read, {
    authSecret: "local-secret-that-is-at-least-32-characters",
    mongodbDatabaseUrl: mongodbUrl,
    mysqlDatabaseUrl: mysqlUrl,
    postgresDatabaseUrl: postgresUrl,
  });
};

// Loading the generator through Vite sets NODE_ENV=development, which breaks `next build`.
export const projectEnv = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => name !== "NODE_ENV")
);
