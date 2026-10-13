import { contribute, defineIntegration } from "@vibestart/core";

import { ormRelease, serverEnv, stackHeadline } from "#/app.ts";
import { composeAppVolumes, composeVolumes, dockerRuntime } from "#/docker.ts";
import {
  ignoredFiles,
  readmeLayers,
  readmeTagline,
} from "#/vite-plus/slots.ts";

export const sqlite = defineIntegration({
  contribute: (ctx) => [
    contribute(serverEnv, {
      example: "local.db",
      name: "DATABASE_URL",
      schema: "z.string().min(1)",
    }),
    contribute(dockerRuntime, {
      env: [["DATABASE_URL", "/data/app.db"]],
      runs: ["mkdir /data && chown nobody:nogroup /data"],
      volumes: ["/data"],
    }),
    contribute(composeAppVolumes, "data:/data"),
    contribute(composeVolumes, "data"),
    ...["*.db", "*.db-shm", "*.db-wal"].map((pattern) =>
      contribute(ignoredFiles, pattern)
    ),
    contribute(readmeTagline, "SQLite"),
    contribute(stackHeadline, "SQLite"),
    contribute(readmeLayers, {
      choice: ctx.has("bun")
        ? `SQLite through Bun's compatible \`node:sqlite\`, ${ormRelease(ctx)}`
        : `SQLite through Node's built-in \`node:sqlite\`, ${ormRelease(ctx)}`,
      layer: "Database",
    }),
  ],
  id: "sqlite",
  kind: "database",
  name: "SQLite",
  description: "Single-file database via node:sqlite",
  homepage: "https://www.sqlite.org",
  provides: ["sql-database"],
  requires: ["http-server", "node-runtime", "sql-orm"],
});
