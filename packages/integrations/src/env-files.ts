import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { ReadSlot } from "@vibestart/core";
import { defineSlot } from "@vibestart/core";

export interface EnvLine {
  readonly name: string;
  readonly example: string;
  readonly comment?: readonly string[];
}

/** A `.env` an app loads; the README lists it and project creation writes it, so the repository keeps no example copy. */
export const envFiles = defineSlot<{
  path: string;
  lines: (read: ReadSlot) => readonly EnvLine[];
}>("app/env-files");

export const renderEnvLines = (lines: readonly EnvLine[]) =>
  lines
    .map(({ comment = [], example, name }) =>
      [...comment.map((line) => `# ${line}`), `${name}=${example}`].join("\n")
    )
    .join("\n");

export interface MaterializeEnvOptions {
  readonly authSecret?: string;
  /** Replaces a `postgres://…` `DATABASE_URL` (stack verification uses the runner's Postgres). */
  readonly postgresDatabaseUrl?: string;
  /** Replaces a `mysql://…` `DATABASE_URL` (stack verification uses the runner's MySQL). */
  readonly mysqlDatabaseUrl?: string;
  /** Replaces a `mongodb://…` `DATABASE_URL` (stack verification uses the runner's MongoDB). */
  readonly mongodbDatabaseUrl?: string;
}

const localValue = (
  { example, name }: EnvLine,
  options: MaterializeEnvOptions
) => {
  if (name === "BETTER_AUTH_SECRET") {
    return options.authSecret ?? example;
  }

  if (name !== "DATABASE_URL") {
    return example;
  }

  const servers = [
    ["postgres:", options.postgresDatabaseUrl],
    ["mysql:", options.mysqlDatabaseUrl],
    ["mongodb:", options.mongodbDatabaseUrl],
  ] as const;

  const server = servers.find(([scheme]) => example.startsWith(scheme));

  return server?.[1] ?? example;
};

/** Each `.env` with its local values, relative to the project root. */
export const renderEnvFiles = (
  read: ReadSlot,
  options: MaterializeEnvOptions = {}
) =>
  read(envFiles).map((file) => ({
    content: `${renderEnvLines(
      file.lines(read).map((line) => ({
        ...line,
        example: localValue(line, options),
      }))
    )}\n`,
    path: file.path,
  }));

export const materializeEnv = (
  projectRoot: string,
  read: ReadSlot,
  options: MaterializeEnvOptions = {}
) => {
  for (const file of renderEnvFiles(read, options)) {
    const target = path.join(projectRoot, file.path);

    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, file.content);
  }
};
