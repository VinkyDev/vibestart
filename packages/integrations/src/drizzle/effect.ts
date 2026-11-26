import type { Context } from "@vibestart/core";
import { contribute, packageJson } from "@vibestart/core";

import { sqlDatabase } from "#/database.ts";
import { authVariant } from "#/example.ts";
import { templateFiles } from "#/templates.ts";
import { agentsMap } from "#/vite-plus/slots.ts";

export const effectDatabase = (ctx: Context) => {
  const database = sqlDatabase(ctx).id;

  const driver =
    database === "sqlite" ? "@effect/sql-sqlite-node" : "@effect/sql-pg";

  return [
    ...templateFiles(ctx, `drizzle/${authVariant(ctx.stack)}`),
    ...templateFiles(ctx, `drizzle/${database}/${authVariant(ctx.stack)}`),
    ...templateFiles(ctx, `drizzle/effect-${database}`),
    ...templateFiles(ctx, "drizzle/effect"),
    contribute(packageJson, {
      dependencies: [driver, "effect"],
      path: "packages/db",
    }),
    contribute(packageJson, {
      path: "apps/server",
      scripts: {
        "db:migrate": "node --env-file-if-exists=.env src/migrate.ts",
      },
    }),
    contribute(agentsMap, {
      path: "packages/db",
      owns: `Drizzle schema, relations, migrations, and the Database service on ${driver}`,
    }),
  ];
};
