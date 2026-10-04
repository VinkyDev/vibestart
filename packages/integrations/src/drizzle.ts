import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  gettingStarted,
  packageJson,
  setupCommand,
} from "@vibestart/core";

import { exampleVariant, hasTables, serverApp, stackHeadline } from "#/app.ts";
import { commentedShell } from "#/format.ts";
import { templateFiles } from "#/templates.ts";
import {
  agentsConventions,
  agentsMap,
  generatedFiles,
  readmeSections,
  readmeTagline,
} from "#/vite-plus/slots.ts";

// drizzle-kit runs from `packages/db`, so it loads the server's `.env` itself.
const drizzleConfig = (ctx: Context) => {
  const { dir } = serverApp(ctx);
  if (ctx.has("sqlite")) {
    const webDir = `../../${dir}`;
    return `import { existsSync } from "node:fs";
import path from "node:path";

import { defineConfig } from "drizzle-kit";

const appDir = "${webDir}";
const appEnvFile = \`\${appDir}/.env\`;

if (existsSync(appEnvFile)) {
  process.loadEnvFile(appEnvFile);
}

export default defineConfig({
  dbCredentials: {
    url: path.resolve(appDir, process.env.DATABASE_URL ?? "local.db"),
  },
  dialect: "sqlite",
  out: "./src/migrations",
  schema: "./src/schema",
});
`;
  }
  return `import { existsSync } from "node:fs";

import { defineConfig } from "drizzle-kit";

const serverEnvFile = "../../${dir}/.env";

if (existsSync(serverEnvFile)) {
  process.loadEnvFile(serverEnvFile);
}

export default defineConfig({
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  dialect: "postgresql",
  out: "./src/migrations",
  schema: "./src/schema",
});
`;
};

const schemaConvention = (ctx: Context) =>
  [
    "Add or edit a table in `packages/db/src/schema/`, register a new table in `src/relations.ts`, and back each invariant with a constraint (`check`, `unique`, foreign keys) as well as Zod. Run `vp run db:generate` and commit the new folder under `src/migrations/`. A committed migration stays as generated.",
    ...(ctx.has("sqlite")
      ? [
          'SQLite stores booleans and timestamps as integers (`integer({ mode: "boolean" })`, `integer({ mode: "timestamp_ms" })`). The driver is synchronous: `db.run()` and the migrator return values; query builders (`select`, `insert`, …) are still awaited.',
        ]
      : []),
    ...(ctx.has("better-auth")
      ? [
          "The Better Auth tables in `schema/auth.ts` match the fields Better Auth expects; read its docs before adding a plugin.",
        ]
      : []),
  ].join(" ");

const packageOwns = (ctx: Context) => {
  const dialect = ctx.has("sqlite") ? " for SQLite" : "";
  const tables = ctx.has("better-auth") ? ", including Better Auth tables" : "";
  return `Drizzle schema${dialect} (\`src/schema/\`${tables}), relations, migrations (\`src/migrations/\`), \`createDb\``;
};

export const drizzle = defineIntegration({
  contribute: (ctx) => {
    const { dir } = serverApp(ctx);
    return [
      ...templateFiles(ctx, "drizzle/common"),
      ...templateFiles(ctx, `drizzle/${exampleVariant(ctx)}`),
      file("packages/db/drizzle.config.ts", drizzleConfig(ctx)),
      // drizzle-kit refuses an empty schema folder, and the migrator needs its folder even when empty.
      hasTables(ctx)
        ? contribute(setupCommand, {
            run: "vp run db:generate --name init",
            writes: ["packages/db/src/migrations/**"],
          })
        : file("packages/db/src/migrations/.gitkeep", ""),
      contribute(packageJson, {
        dependencies: ["drizzle-orm"],
        devDependencies: [
          `${ctx.scope}/config`,
          "@types/node",
          "drizzle-kit",
          "typescript",
        ],
        exports: {
          ".": "./src/index.ts",
          "./migrate": "./src/migrate.ts",
          "./schema/*": "./src/schema/*.ts",
        },
        imports: { "#src/*": "./src/*" },
        path: "packages/db",
        scripts: {
          "db:generate": "drizzle-kit generate",
          "db:studio": "drizzle-kit studio",
        },
      }),
      contribute(packageJson, { dependencies: [`${ctx.scope}/db`], path: dir }),
      contribute(packageJson, {
        path: ".",
        scripts: {
          "db:generate": `vp run --filter ${ctx.scope}/db db:generate`,
          "db:migrate": `vp run --filter ${ctx.scope}/${dir.slice("apps/".length)} db:migrate`,
          "db:studio": `vp run --filter ${ctx.scope}/db db:studio`,
        },
      }),
      contribute(generatedFiles, {
        glob: "packages/db/src/migrations/**",
        label: "packages/db/src/migrations/**",
      }),
      contribute(agentsMap, { owns: packageOwns(ctx), path: "packages/db" }),
      contribute(agentsConventions, {
        text: schemaConvention(ctx),
        title: "Schema",
      }),
      contribute(readmeTagline, "Drizzle"),
      contribute(stackHeadline, "Drizzle"),
      contribute(gettingStarted, {
        run: "vp run db:migrate",
        note: ctx.has("sqlite")
          ? {
              id: "sqlite-file",
              text: `creates ${dir}/local.db`,
              values: { path: `${dir}/local.db` },
            }
          : undefined,
      }),
      contribute(readmeSections, () =>
        [
          "## Database",
          "Edit a table in `packages/db/src/schema/`, then:",
          [
            "```sh",
            commentedShell([
              [
                "vp run db:generate",
                "writes a migration to packages/db/src/migrations/",
              ],
              ["vp run db:migrate", "applies it"],
            ]),
            "```",
          ].join("\n"),
        ].join("\n\n")
      ),
    ];
  },
  id: "drizzle",
  kind: "orm",
  name: "Drizzle",
  description: "Drizzle ORM v1 with SQL migrations",
  homepage: "https://orm.drizzle.team",
  provides: ["sql-orm"],
  requires: ["sql-database"],
});
