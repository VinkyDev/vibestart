import type { Context } from "@vibestart/core";
import {
  contribute,
  gettingStarted,
  packageJson,
  setupCommand,
} from "@vibestart/core";

import { templateFiles } from "#/templates.ts";
import { agentsMap, generatedFiles } from "#/vite-plus/slots.ts";

export const effectDatabase = (ctx: Context) => [
  ...templateFiles(ctx, "drizzle/effect"),
  contribute(packageJson, {
    dependencies: ["@effect/sql-pg", "drizzle-orm", "effect"],
    devDependencies: [
      `${ctx.scope}/config`,
      "@types/node",
      "drizzle-kit",
      "typescript",
    ],
    imports: {
      "#src/*": "./src/*",
    },
    exports: {
      ".": "./src/index.ts",
      "./migrate": "./src/migrate.ts",
      "./relations": "./src/relations.ts",
      "./schema/*": "./src/schema/*.ts",
      "./testing": "./src/testing.ts",
    },
    scripts: {
      "db:generate": "drizzle-kit generate",
      "db:studio": "drizzle-kit studio",
    },
    path: "packages/db",
  }),
  contribute(packageJson, {
    path: ".",
    scripts: {
      "db:generate": `vp run --filter ${ctx.scope}/db db:generate`,
      "db:migrate": `vp run --filter ${ctx.scope}/server db:migrate`,
      "db:studio": `vp run --filter ${ctx.scope}/db db:studio`,
    },
  }),
  contribute(setupCommand, {
    run: "vp run db:generate --name init",
    writes: ["packages/db/src/migrations/**"],
  }),
  contribute(generatedFiles, {
    glob: "packages/db/src/migrations/**",
    label: "packages/db/src/migrations/**",
  }),
  contribute(gettingStarted, { run: "vp run db:migrate" }),
  contribute(agentsMap, {
    path: "packages/db",
    owns: "Drizzle schema, relations, migrations, and the Database service on @effect/sql-pg",
  }),
];
