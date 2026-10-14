import type { Context } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  gettingStarted,
  packageJson,
  pnpmWorkspace,
  setupCommand,
} from "@vibestart/core";

import {
  closeDatabase,
  hasTables,
  migrationEntry,
  serverApp,
  sqlDatabase,
  stackHeadline,
  todosExample,
} from "#/app.ts";
import { commentedShell } from "#/format.ts";
import { knipEntries } from "#/knip.ts";
import { templateFiles } from "#/templates.ts";
import {
  agentsConventions,
  agentsMap,
  generatedFiles,
  ignoredFiles,
  readmeSections,
  readmeTagline,
  readySteps,
} from "#/vite-plus/slots.ts";

// Prisma supports PostgreSQL and MySQL here: its SQLite drivers are native modules, which the bundled server
// image cannot carry, so SQLite stays on Drizzle and `node:sqlite`.
type ServerDatabase = "mysql" | "postgres";

const serverDatabase = (ctx: Context): ServerDatabase => {
  const { id } = sqlDatabase(ctx);

  if (id === "sqlite") {
    throw new Error("Prisma requires a database server");
  }

  return id;
};

const providers = { mysql: "mysql", postgres: "postgresql" } as const;

const schemaFile = (ctx: Context) => `generator client {
  provider            = "prisma-client"
  output              = "../generated"
  moduleFormat        = "esm"
  importFileExtension = "ts"
}

datasource db {
  provider = "${providers[serverDatabase(ctx)]}"
}
`;

// MySQL maps `String` to `varchar(191)`: a value that can be longer is `text`, and an indexed one that can be
// longer is `varchar(255)`.
const columnTypes = (ctx: Context) =>
  serverDatabase(ctx) === "mysql"
    ? { indexed: " @db.VarChar(255)", long: " @db.Text" }
    : { indexed: "", long: "" };

const authModels = (ctx: Context) => {
  const { indexed, long } = columnTypes(ctx);
  const todos = todosExample(ctx) ? ["  todos         Todo[]"] : [];

  return `model User {
  id            String    @id
  name          String${long}
  email         String    @unique${indexed}
  emailVerified Boolean   @default(false) @map("email_verified")
  image         String?${long}
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  accounts      Account[]
  sessions      Session[]
${[...todos, ""].join("\n")}
  @@map("user")
}

model Session {
  id        String   @id
  expiresAt DateTime @map("expires_at")
  token     String   @unique${indexed}
  ipAddress String?  @map("ip_address")${long}
  userAgent String?  @map("user_agent")${long}
  userId    String   @map("user_id")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([userId], map: "session_user_id_idx")
  @@map("session")
}

model Account {
  id                    String    @id
  accountId             String    @map("account_id")${long}
  providerId            String    @map("provider_id")${long}
  userId                String    @map("user_id")
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?   @map("access_token")${long}
  refreshToken          String?   @map("refresh_token")${long}
  idToken               String?   @map("id_token")${long}
  accessTokenExpiresAt  DateTime? @map("access_token_expires_at")
  refreshTokenExpiresAt DateTime? @map("refresh_token_expires_at")
  scope                 String?${long}
  password              String?${long}
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime  @updatedAt @map("updated_at")

  @@index([userId], map: "account_user_id_idx")
  @@map("account")
}

model Verification {
  id         String   @id
  identifier String${indexed}
  value      String${long}
  expiresAt  DateTime @map("expires_at")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@index([identifier], map: "verification_identifier_idx")
  @@map("verification")
}
`;
};

const todoModel = (ctx: Context) => {
  const title = serverDatabase(ctx) === "mysql" ? " @db.VarChar(200)" : "";

  const owner = ctx.has("better-auth")
    ? [
        '  userId    String   @map("user_id")',
        "  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)",
        "",
        '  @@index([userId], map: "todos_user_id_idx")',
      ]
    : [""];

  return [
    "model Todo {",
    "  id        Int      @id @default(autoincrement())",
    `  title     String${title}`,
    "  completed Boolean  @default(false)",
    '  createdAt DateTime @default(now()) @map("created_at")',
    ...owner,
    '  @@map("todos")',
    "}",
    "",
  ].join("\n");
};

// Prisma Migrate's own history table, so `prisma migrate dev` and `prisma migrate status` read what the
// migrator applied, and the other way around.
const historyTables: Record<ServerDatabase, string> = {
  mysql: `CREATE TABLE IF NOT EXISTS _prisma_migrations (
  id                  VARCHAR(36) PRIMARY KEY NOT NULL,
  checksum            VARCHAR(64) NOT NULL,
  finished_at         DATETIME(3),
  migration_name      VARCHAR(255) NOT NULL,
  logs                TEXT,
  rolled_back_at      DATETIME(3),
  started_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  applied_steps_count INTEGER UNSIGNED NOT NULL DEFAULT 0
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  postgres: `CREATE TABLE IF NOT EXISTS _prisma_migrations (
  id                  VARCHAR(36) PRIMARY KEY NOT NULL,
  checksum            VARCHAR(64) NOT NULL,
  finished_at         TIMESTAMPTZ,
  migration_name      VARCHAR(255) NOT NULL,
  logs                TEXT,
  rolled_back_at      TIMESTAMPTZ,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_steps_count INTEGER NOT NULL DEFAULT 0
)`,
};

// Held for the whole run on the transaction's connection. PostgreSQL releases its transaction lock at the end of
// the transaction; MySQL's named lock outlives the commits its DDL makes, so the run releases it.
const lockStatements = (ctx: Context) =>
  serverDatabase(ctx) === "postgres"
    ? [
        '    await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(7270736973)");',
        "    await applyInOrder(tx, await pending(tx));",
      ].join("\n")
    : [
        "    await tx.$executeRawUnsafe(\"SELECT GET_LOCK('prisma_migrate', -1)\");",
        "    try {",
        "      await applyInOrder(tx, await pending(tx));",
        "    } finally {",
        "      await tx.$executeRawUnsafe(\"SELECT RELEASE_LOCK('prisma_migrate')\");",
        "    }",
      ].join("\n");

const run = (ctx: Context) =>
  [
    "// A migration may outlast the default 5 seconds of an interactive transaction.",
    "await db.$transaction(",
    "  async (tx) => {",
    lockStatements(ctx),
    "  },",
    "  { maxWait: 600_000, timeout: 600_000 }",
    ");",
  ].join("\n");

const indent = (text: string, by: string) =>
  text
    .split("\n")
    .map((line) => (line === "" ? line : `${by}${line}`))
    .join("\n");

// PostgreSQL rolls a failed run back whole, history rows included, so the next run starts clean. MySQL commits each
// DDL statement: the failed migration's row stays unfinished, and gets the error, outside the rolled-back transaction.
const migrateBody = (ctx: Context) =>
  serverDatabase(ctx) === "postgres"
    ? indent(run(ctx), "  ")
    : [
        "  try {",
        indent(run(ctx), "    "),
        "  } catch (error) {",
        "    // MySQL committed the DDL before the failure; the unfinished row stops later runs until `prisma migrate resolve`.",
        "    const logs = error instanceof Error ? error.message : String(error);",
        "    await db.$executeRaw`UPDATE _prisma_migrations SET logs = $" +
          "{logs} WHERE finished_at IS NULL AND rolled_back_at IS NULL AND logs IS NULL`.catch(",
        "      () => 0",
        "    );",
        "    throw error;",
        "  }",
      ].join("\n");

const migrateModule = (
  ctx: Context
) => `import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Database } from "#src/index.ts";

const migrationsFolder = fileURLToPath(new URL("migrations", import.meta.url));

// Prisma Migrate's history table: \`prisma migrate dev\` and \`prisma migrate status\` read what this applies.
const historyTable = \`${historyTables[serverDatabase(ctx)]}\`;

// Prisma writes one statement per \`;\`-terminated line block, and comments on lines of their own.
const statementsOf = (script: string) =>
  script
    .split(/;\\s*$/mu)
    .map((statement) => statement.replaceAll(/^--.*$/gmu, "").trim())
    .filter((statement) => statement !== "");

const executeInOrder = async (
  db: Pick<Database, "$executeRawUnsafe">,
  [statement, ...rest]: string[]
): Promise<void> => {
  if (statement === undefined) {
    return;
  }

  await db.$executeRawUnsafe(statement);
  await executeInOrder(db, rest);
};

// The statements a run needs: Prisma's client binds a transaction's queries to one connection.
type Session = Pick<
  Database,
  "$executeRaw" | "$executeRawUnsafe" | "$queryRaw"
>;

const applyMigration = async (db: Session, name: string) => {
  const script = await readFile(
    path.join(migrationsFolder, name, "migration.sql"),
    "utf-8"
  );

  const id = randomUUID();
  const checksum = createHash("sha256").update(script).digest("hex");
  await db.$executeRaw\`INSERT INTO _prisma_migrations (id, checksum, migration_name) VALUES (\${id}, \${checksum}, \${name})\`;
  await executeInOrder(db, statementsOf(script));
  await db.$executeRaw\`UPDATE _prisma_migrations SET finished_at = CURRENT_TIMESTAMP, applied_steps_count = 1 WHERE id = \${id}\`;
};

const applyInOrder = async (db: Session, [name, ...rest]: string[]) => {
  if (name === undefined) {
    return;
  }

  await applyMigration(db, name);
  await applyInOrder(db, rest);
};

const pending = async (db: Session) => {
  await db.$executeRawUnsafe(historyTable);

  const unresolved = await db.$queryRaw<{ migration_name: string }[]>\`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL\`;

  if (unresolved.length > 0) {
    const names = unresolved.map((row) => row.migration_name).join(", ");
    throw new Error(
      \`Migration \${names} failed: repair the schema, then mark it with \\\`prisma migrate resolve\\\` before migrating again\`
    );
  }

  const finished = await db.$queryRaw<{ migration_name: string }[]>\`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL\`;

  const applied = new Set(finished.map((row) => row.migration_name));
  const entries = await readdir(migrationsFolder, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory() && !applied.has(entry.name))
    .map((entry) => entry.name)
    .toSorted();
};

/**
 * Applies the migrations under \`src/migrations\` that the database has not finished, in name order. A lock held
 * from the history check to the last migration makes concurrent deploys apply each migration once; a migration
 * that failed stops every later run until \`prisma migrate resolve\` marks it.
 */
export const migrateDatabase = async (db: Database) => {
${migrateBody(ctx)}
};
`;

// The Prisma CLI runs from `packages/db`, so its config loads the server's `.env` itself.
const prismaConfig = (ctx: Context) => `import { existsSync } from "node:fs";

import { defineConfig } from "prisma/config";

const serverEnvFile = "../../${serverApp(ctx).dir}/.env";

if (existsSync(serverEnvFile)) {
  process.loadEnvFile(serverEnvFile);
}

export default defineConfig({
  datasource: { url: process.env.DATABASE_URL ?? "" },
  migrations: { path: "src/migrations" },
  schema: "src/schema",
});
`;

const migrationLock = (ctx: Context) =>
  `# Please do not edit this file manually
# It should be added in your version-control system (e.g., Git)
provider = "${providers[serverDatabase(ctx)]}"
`;

const schemaConvention = (ctx: Context) =>
  [
    "Edit a model in `packages/db/src/schema/*.prisma`, then run `vp run db:generate --name <change>`: Prisma diffs the schema against the database and writes a migration folder under `src/migrations/`, which you commit. A committed migration stays as generated. Validate input with Zod; Prisma has no `check` constraints.",
    "The client is generated into `src/generated/` (`vp run db:client`, which `vp run ready` and the build run first) and is not committed. Import `PrismaClient` types from `#src/generated/client.ts` inside `packages/db` and `Database` from the package elsewhere.",
    ...(ctx.has("better-auth")
      ? [
          "The Better Auth models in `schema/auth.prisma` match the fields Better Auth expects; read its docs before adding a plugin.",
        ]
      : []),
  ].join(" ");

const modelFiles = (ctx: Context) => [
  file("packages/db/src/schema/schema.prisma", schemaFile(ctx)),
  ...(ctx.has("better-auth")
    ? [file("packages/db/src/schema/auth.prisma", authModels(ctx))]
    : []),
  ...(todosExample(ctx)
    ? [file("packages/db/src/schema/todos.prisma", todoModel(ctx))]
    : []),
];

export const prisma = defineIntegration({
  contribute: (ctx) => {
    const { dir } = serverApp(ctx);
    const database = serverDatabase(ctx);

    return [
      ...templateFiles(ctx, "prisma/common"),
      ...templateFiles(ctx, `prisma/${database}/common`),
      ...modelFiles(ctx),
      file("packages/db/prisma.config.ts", prismaConfig(ctx)),
      file("packages/db/src/migrate.ts", migrateModule(ctx)),
      file(
        "packages/db/src/migrations/migration_lock.toml",
        migrationLock(ctx)
      ),
      migrationEntry(ctx, ["await migrateDatabase(db);", closeDatabase(ctx)]),
      // `prisma migrate dev` needs a database; the first migration is the schema's diff from nothing.
      ...(hasTables(ctx)
        ? [
            contribute(setupCommand, {
              run: `vp run --filter ${ctx.scope}/db db:init`,
              stage: "generate",
              writes: ["packages/db/src/migrations/0_init/**"],
            }),
          ]
        : []),
      contribute(setupCommand, {
        run: "vp run db:client",
        stage: "generate",
        writes: ["packages/db/src/generated/**"],
      }),
      contribute(packageJson, {
        dependencies: [
          "@prisma/client",
          database === "mysql"
            ? "@prisma/adapter-mariadb"
            : "@prisma/adapter-pg",
        ],
        devDependencies: [
          `${ctx.scope}/config`,
          "@types/node",
          "prisma",
          "typescript",
        ],
        exports: { ".": "./src/index.ts", "./migrate": "./src/migrate.ts" },
        imports: { "#src/*": "./src/*" },
        path: "packages/db",
        scripts: {
          build: "prisma generate",
          "db:client": "prisma generate",
          "db:generate": "prisma migrate dev --create-only",
          "db:init":
            "prisma migrate diff --from-empty --to-schema src/schema --script --output src/migrations/0_init/migration.sql",
          "db:studio": "prisma studio",
        },
      }),
      contribute(packageJson, { dependencies: [`${ctx.scope}/db`], path: dir }),
      contribute(packageJson, {
        path: ".",
        scripts: {
          "db:client": `vp run --filter ${ctx.scope}/db db:client`,
          "db:generate": `vp run --filter ${ctx.scope}/db db:generate`,
          "db:migrate": `vp run --filter ${ctx.scope}/${dir.slice("apps/".length)} db:migrate`,
          "db:studio": `vp run --filter ${ctx.scope}/db db:studio`,
        },
      }),
      contribute(readySteps, {
        command: "vp run db:client",
        description: "the Prisma client in packages/db/src/generated",
        label: "db:client",
        phase: "prepare",
      }),
      contribute(pnpmWorkspace, {
        allowBuilds: { "@prisma/engines": true, prisma: true },
      }),
      contribute(generatedFiles, {
        glob: "packages/db/src/generated/**",
        label: "packages/db/src/generated/",
        note: "`vp run db:client` writes the Prisma client; a fresh clone runs it before `vp check`.",
      }),
      contribute(generatedFiles, {
        glob: "packages/db/src/migrations/**",
        label: "packages/db/src/migrations/**",
      }),
      contribute(ignoredFiles, "packages/db/src/generated"),
      // Only the generated client imports `@prisma/client`, and Knip skips ignored files.
      contribute(knipEntries, {
        ignoreDependencies: ["@prisma/client"],
        workspace: "packages/db",
      }),
      contribute(agentsMap, {
        owns: `Prisma schema (\`src/schema/*.prisma\`${ctx.has("better-auth") ? ", including Better Auth models" : ""}), migrations (\`src/migrations/\`), \`createDb\``,
        path: "packages/db",
      }),
      contribute(agentsConventions, {
        text: schemaConvention(ctx),
        title: "Schema",
      }),
      contribute(readmeTagline, "Prisma"),
      contribute(stackHeadline, "Prisma"),
      contribute(gettingStarted, { run: "vp run db:migrate" }),
      contribute(readmeSections, () =>
        [
          "## Database",
          "Edit a model in `packages/db/src/schema/`, then:",
          [
            "```sh",
            commentedShell([
              [
                "vp run db:generate --name <change>",
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
  id: "prisma",
  kind: "orm",
  name: "Prisma",
  description: "Prisma ORM 7 with Prisma Migrate",
  homepage: "https://www.prisma.io",
  provides: ["sql-orm"],
  requires: ["database-server"],
});
