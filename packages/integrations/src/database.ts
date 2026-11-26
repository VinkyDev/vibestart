import type { Context, Stack } from "@vibestart/core";
import { file } from "@vibestart/core";

import { serverApp } from "#/server-environment.ts";

const databases = [
  { id: "mysql", dialect: "mysql", name: "MySQL", server: true },
  { id: "postgres", dialect: "postgresql", name: "PostgreSQL", server: true },
  { id: "sqlite", dialect: "sqlite", name: "SQLite", server: false },
  { id: "mongodb", name: "MongoDB", server: true },
] as const;

const databaseOf = (ctx: Context) =>
  databases.find(({ id }) => id === ctx.stack.database);

export const hasDatabaseServer = (ctx: Context) =>
  databaseOf(ctx)?.server === true;

export const chosenDatabase = (ctx: Context) => {
  const database = databaseOf(ctx);

  if (database === undefined) {
    throw new Error("A database is required");
  }

  return database;
};

export const sqlDatabase = (ctx: Context) => {
  const database = chosenDatabase(ctx);

  if (database.id === "mongodb") {
    throw new Error("A SQL database is required");
  }

  return database;
};

export const databaseName = (ctx: Context) => chosenDatabase(ctx).name;

/** `run` migrates and closes `db`, in the driver's sync or async form. */
export const migrationEntry = (ctx: Context, run: readonly string[]) => {
  const { envImport, read, src } = serverApp(ctx);

  return file(
    `${src}/migrate.ts`,
    [
      `import { createDb } from "${ctx.scope}/db";`,
      `import { migrateDatabase } from "${ctx.scope}/db/migrate";`,
      "",
      envImport,
      "",
      `const db = createDb(${read("DATABASE_URL")});`,
      // Each statement stands apart, as Ultracite's readable-spacing rule asks.
      ...(ctx.has("workers")
        ? [
            "",
            "try {",
            ...run.slice(0, -1).map((statement) => `  ${statement}`),
            "} finally {",
            `  ${run.at(-1)}`,
            "}",
          ]
        : run.flatMap((statement) => ["", statement])),
      "",
    ].join("\n")
  );
};

const migrationCopy =
  '    copy: [{ from: "../../packages/db/src/migrations", to: "dist" }],\n';

/** A `vp pack` config bundling the migration entry: it copies the SQL migrations, which MongoDB does not have. */
export const packConfig = (ctx: Context, path: string, content: string) => {
  if (!content.includes(migrationCopy)) {
    throw new Error(`${path} does not copy the migrations`);
  }

  return ctx.has("mongodb") ? content.replace(migrationCopy, "") : content;
};

const orms = [
  { id: "drizzle", name: "Drizzle", release: "Drizzle ORM v1" },
  { id: "prisma", name: "Prisma", release: "Prisma ORM 7" },
  { id: "mongoose", name: "Mongoose", release: "Mongoose 9" },
] as const;

const ormOf = (ctx: Context) => {
  const orm = orms.find(({ id }) => id === ctx.stack.orm);

  if (orm === undefined) {
    throw new Error("An ORM is required");
  }

  return orm;
};

export const ormId = (ctx: Context) => ormOf(ctx).id;

/** The packages a module needs to query through the ORM beside the `db` package: Drizzle's operators. */
export const ormDependencies = (ctx: Context) =>
  ormId(ctx) === "drizzle" ? ["drizzle-orm"] : [];

/** The ORM as the README's layers table names it, with its major version. */
export const ormRelease = (ctx: Context) => ormOf(ctx).release;

export const databaseFlow = (ctx: Context) =>
  ctx.stack.database === undefined
    ? ""
    : ` → ${ormOf(ctx).name} → ${databaseName(ctx)}`;

/**
 * A `select 1` through the ORM, for a health check: the statement, whether it awaits, the imports it needs, and
 * the packages those come from.
 */
export const databaseCheck = (ctx: Context, db: string) => {
  if (ctx.has("mongoose")) {
    return {
      async: true,
      dependencies: [],
      imports: [],
      statement: `await ${db}.connection.getClient().db().command({ ping: 1 });`,
    };
  }

  if (ctx.has("prisma")) {
    return {
      async: true,
      dependencies: [],
      imports: [],
      statement: `await ${db}.$queryRaw\`select 1\`;`,
    };
  }

  const drizzle = {
    dependencies: ["drizzle-orm"],
    imports: ['import { sql } from "drizzle-orm";'],
  };

  return ctx.has("sqlite")
    ? { ...drizzle, async: false, statement: `${db}.run(sql\`select 1\`);` }
    : {
        ...drizzle,
        async: true,
        statement: `await ${db}.execute(sql\`select 1\`);`,
      };
};

/** The statement that closes `db` once a script is done with it. */
export const closeDatabase = ({ database, orm }: Stack) => {
  if (orm === "mongoose") {
    return "await db.connection.close();";
  }

  if (orm === "prisma") {
    return "await db.$disconnect();";
  }

  if (database === "sqlite") {
    return "db.$client.close();";
  }

  return database === "mysql"
    ? "await db.$client.promise().end();"
    : "await db.$client.end();";
};
