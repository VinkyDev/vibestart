import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

import type { Stack } from "@vibestart/core";
import { legalStacks } from "@vibestart/core";

import { registry } from "#/registry.ts";
import { repoRoot } from "#/repo.ts";
import { stackLabel } from "#/stack-label.ts";

/** Every integration appears in at least one golden. */
const goldenLabels = [
  "spa-hono-orpc-postgres-better-auth-docker-e2e",
  "tanstack-start-self-orpc-postgres-better-auth-docker",
  "next-self-orpc-sqlite-better-auth-docker",
  "spa-hono-orpc-postgres-better-auth-docker",
  "spa-hono-orpc-postgres-better-auth-electron-docker",
  "next-hono-openapi-postgres-better-auth-docker",
  "hono-openapi-sqlite-docker",
  "hono-openapi-sqlite-bun-docker",
];

export const goldens: Record<string, Stack> = Object.fromEntries(
  goldenLabels.map((label) => {
    const stack = legalStacks(registry).find(
      (legal) => stackLabel(legal) === label
    );
    if (stack === undefined) {
      throw new Error(`Golden ${label} is not a legal stack`);
    }
    return [label, stack];
  })
);

export const goldenRoot = (golden: string) => `${repoRoot}golden/${golden}/`;

export const goldenPaths = (golden: string) => {
  const root = goldenRoot(golden);
  return execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    { cwd: root, encoding: "utf-8" }
  )
    .split("\0")
    .filter((file) => file !== "" && existsSync(`${root}${file}`));
};
