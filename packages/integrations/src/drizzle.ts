import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  gettingStarted,
  packageJson,
  setupCommand,
} from "@vibestart/core";

import {
  authVariant,
  closeDatabase,
  exampleVariant,
  migrationEntry,
  todosExample,
  hasTables,
  serverApp,
  sqlDatabase,
  stackHeadline,
} from "#/app.ts";
import { drizzleConfig } from "#/drizzle/config.ts";
import { effectDatabase } from "#/drizzle/effect.ts";
import { commentedShell } from "#/format.ts";
import { replaceOnce, templateContent, templateFiles } from "#/templates.ts";
import {
  agentsConventions,
  agentsMap,
  generatedFiles,
  readmeSections,
  readmeTagline,
} from "#/vite-plus/slots.ts";

const schemaConvention = (ctx: Context) =>
  [
    "Add or edit a table in `packages/db/src/schema/`, register a new table in `src/relations.ts`, and back each invariant with a constraint (`check`, `unique`, foreign keys) as well as Zod. Run `vp run db:generate` and commit the new folder under `src/migrations/`. A committed migration stays as generated.",
    ...(ctx.has("sqlite")
      ? [
          'SQLite stores booleans and timestamps as integers (`integer({ mode: "boolean" })`, `integer({ mode: "timestamp_ms" })`). The driver is synchronous: `db.run()` and the migrator return values; query builders (`select`, `insert`, …) are still awaited.',
        ]
      : []),
    ...(ctx.has("mysql")
      ? [
          "MySQL has no `returning`: read a row back after a write (`$returningId()` on insert), and give a column that is indexed or unique a bounded `varchar`.",
        ]
      : []),
    ...(ctx.has("better-auth")
      ? [
          "The Better Auth tables in `schema/auth.ts` match the fields Better Auth expects; read its docs before adding a plugin.",
        ]
      : []),
  ].join(" ");

const packageOwns = (ctx: Context) => {
  const { id, name } = sqlDatabase(ctx);
  const dialect = id === "postgres" ? "" : ` for ${name}`;
  const tables = ctx.has("better-auth") ? ", including Better Auth tables" : "";

  return `Drizzle schema${dialect} (\`src/schema/\`${tables}), relations, migrations (\`src/migrations/\`), \`createDb\``;
};

const clientPath = "packages/db/src/index.ts";

// A Worker opens a client per request behind Hyperdrive's pool. Workers forbid eval, and Drizzle parses Postgres arrays itself, so the type lookup is a wasted round trip.
const workerClientOptions = {
  mysql: [
    "createPool({ uri: url })",
    "createPool({ uri: url, disableEval: true, connectionLimit: 1 })",
  ],
  postgres: [
    'connection: { client_min_messages: "warning" }, url',
    'connection: { client_min_messages: "warning" }, fetch_types: false, max: 5, url',
  ],
} as const;

const workerClient = (
  ctx: Context,
  database: keyof typeof workerClientOptions
) => {
  const set = `drizzle/${database}/common`;
  const [from, to] = workerClientOptions[database];

  return file(
    clientPath,
    replaceOnce(
      templateContent(ctx, set, clientPath),
      from,
      to,
      `${set}/${clientPath}`
    )
  );
};

export const drizzle = defineIntegration({
  contribute: (ctx) => {
    if (ctx.has("effect")) {
      return effectDatabase(ctx);
    }

    const { dir } = serverApp(ctx);
    const database = sqlDatabase(ctx).id;

    return [
      ...templateFiles(ctx, "drizzle/common"),
      ...(ctx.has("workers") && database !== "sqlite"
        ? [
            ...templateFiles(ctx, `drizzle/${database}/common`, {
              except: [clientPath],
            }),
            workerClient(ctx, database),
          ]
        : templateFiles(ctx, `drizzle/${database}/common`)),
      ...(todosExample(ctx)
        ? templateFiles(ctx, `drizzle/${database}/${authVariant(ctx)}`)
        : []),
      ...(ctx.has("better-auth")
        ? templateFiles(ctx, `drizzle/${database}/auth-tables`)
        : []),
      migrationEntry(ctx, [
        `${database === "sqlite" ? "" : "await "}migrateDatabase(db);`,
        closeDatabase(ctx),
      ]),
      ...(database === "sqlite"
        ? []
        : [
            contribute(packageJson, {
              dependencies: [database === "mysql" ? "mysql2" : "postgres"],
              path: "packages/db",
            }),
          ]),
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
