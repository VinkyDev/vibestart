import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  gettingStarted,
  packageJson,
} from "@vibestart/core";

import {
  authVariant,
  closeDatabase,
  migrationEntry,
  serverApp,
  stackHeadline,
  todosExample,
} from "#/app.ts";
import { commentedShell } from "#/format.ts";
import { templateFiles } from "#/templates.ts";
import {
  agentsConventions,
  agentsMap,
  readmeSections,
  readmeTagline,
} from "#/vite-plus/slots.ts";

const renderIndex = (ctx: Context) => {
  const todos = todosExample(ctx);

  return [
    'import mongoose from "mongoose";',
    "",
    ...(todos
      ? ['import { todoSchema } from "#src/schema/todos.ts";', ""]
      : []),
    ...(todos ? ['export { toTodo } from "#src/schema/todos.ts";', ""] : []),
    "// `migrateDatabase` builds the indexes once, at deploy, rather than every connection at startup.",
    "export const createDb = (url: string) => {",
    "  const connection = mongoose.createConnection(url, { autoIndex: false });",
    "",
    todos
      ? '  return { connection, todos: connection.model("Todo", todoSchema) };'
      : "  return { connection };",
    "};",
    "",
    "export type Database = ReturnType<typeof createDb>;",
    "",
  ].join("\n");
};

// Better Auth's MongoDB adapter creates its collections on first write but no indexes: these are the lookups it
// makes on every sign-in and session read, and the uniqueness it expects of an email and a session token.
const authIndexes = [
  '    native.collection("user").createIndex({ email: 1 }, { unique: true }),',
  '    native.collection("session").createIndex({ token: 1 }, { unique: true }),',
  '    native.collection("session").createIndex({ userId: 1 }),',
  '    native.collection("account").createIndex({ userId: 1 }),',
  '    native.collection("verification").createIndex({ identifier: 1 }),',
];

const renderMigrate = (ctx: Context) => {
  const auth = ctx.has("better-auth");

  return [
    'import type { Database } from "#src/index.ts";',
    "",
    "/**",
    " * MongoDB has no schema to migrate: this builds the indexes each model declares and drops the ones no model",
    " * declares any more.",
    ...(auth
      ? [" * Better Auth's collections get the indexes it queries by."]
      : []),
    " */",
    "export const migrateDatabase = async ({ connection }: Database) => {",
    "  await connection.syncIndexes();",
    ...(auth
      ? [
          "  const native = connection.getClient().db();",
          "  await Promise.all([",
          ...authIndexes,
          "  ]);",
        ]
      : []),
    "};",
    "",
  ].join("\n");
};

const schemaConvention = (ctx: Context) =>
  [
    "Each collection is a Mongoose schema in `packages/db/src/schema/`, registered as a model in `createDb`. MongoDB has no migrations: a new field is optional, or has a default, so documents written before it still read. `vp run db:migrate` builds the indexes the schemas declare; run it after adding or removing one.",
    "Queries return plain objects (`.lean()`). The API exposes an `ObjectId` as a 24-character hex string `id`; validate one with Zod before a query uses it.",
    ...(ctx.has("better-auth")
      ? [
          "Better Auth's adapter owns the `user`, `session`, `account`, and `verification` collections; read its docs before adding a plugin.",
        ]
      : []),
  ].join(" ");

export const mongoose = defineIntegration({
  contribute: (ctx) => {
    const { dir } = serverApp(ctx);

    return [
      ...templateFiles(ctx, "mongoose/common"),
      file("packages/db/src/index.ts", renderIndex(ctx)),
      ...(todosExample(ctx)
        ? templateFiles(ctx, `mongoose/${authVariant(ctx)}`)
        : []),
      file("packages/db/src/migrate.ts", renderMigrate(ctx)),
      migrationEntry(ctx, ["await migrateDatabase(db);", closeDatabase(ctx)]),
      contribute(packageJson, {
        dependencies: ["mongoose"],
        devDependencies: [`${ctx.scope}/config`, "@types/node", "typescript"],
        exports: { ".": "./src/index.ts", "./migrate": "./src/migrate.ts" },
        imports: { "#src/*": "./src/*" },
        path: "packages/db",
      }),
      contribute(packageJson, { dependencies: [`${ctx.scope}/db`], path: dir }),
      contribute(packageJson, {
        path: ".",
        scripts: {
          "db:migrate": `vp run --filter ${ctx.scope}/${dir.slice("apps/".length)} db:migrate`,
        },
      }),
      contribute(agentsMap, {
        owns: "Mongoose schemas (`src/schema/`), index builds (`src/migrate.ts`), `createDb`",
        path: "packages/db",
      }),
      contribute(agentsConventions, {
        text: schemaConvention(ctx),
        title: "Schema",
      }),
      contribute(readmeTagline, "Mongoose"),
      contribute(stackHeadline, "Mongoose"),
      contribute(gettingStarted, { run: "vp run db:migrate" }),
      contribute(readmeSections, () =>
        [
          "## Database",
          "Edit a schema in `packages/db/src/schema/`. A new field is optional or has a default, so existing documents still read. Then:",
          [
            "```sh",
            commentedShell([
              ["vp run db:migrate", "builds the indexes the schemas declare"],
            ]),
            "```",
          ].join("\n"),
        ].join("\n\n")
      ),
    ];
  },
  id: "mongoose",
  kind: "orm",
  name: "Mongoose",
  description: "Mongoose 9 schemas and models for MongoDB",
  homepage: "https://mongoosejs.com",
  provides: ["document-orm"],
  requires: ["document-database"],
});
