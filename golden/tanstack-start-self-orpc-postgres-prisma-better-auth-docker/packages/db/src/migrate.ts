import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Database } from "#src/index.ts";

const migrationsFolder = fileURLToPath(new URL("migrations", import.meta.url));

// Prisma Migrate's history table: `prisma migrate dev` and `prisma migrate status` read what this applies.
const historyTable = `CREATE TABLE IF NOT EXISTS _prisma_migrations (
  id                  VARCHAR(36) PRIMARY KEY NOT NULL,
  checksum            VARCHAR(64) NOT NULL,
  finished_at         TIMESTAMPTZ,
  migration_name      VARCHAR(255) NOT NULL,
  logs                TEXT,
  rolled_back_at      TIMESTAMPTZ,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  applied_steps_count INTEGER NOT NULL DEFAULT 0
)`;

// Prisma writes one statement per `;`-terminated line block, and comments on lines of their own.
const statementsOf = (script: string) =>
  script
    .split(/;\s*$/mu)
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

const applyMigration = async (db: Database, name: string) => {
  const script = await readFile(
    path.join(migrationsFolder, name, "migration.sql"),
    "utf-8"
  );
  const id = randomUUID();
  const checksum = createHash("sha256").update(script).digest("hex");
  await db.$executeRaw`INSERT INTO _prisma_migrations (id, checksum, migration_name) VALUES (${id}, ${checksum}, ${name})`;
  // A migration may outlast the default 5 seconds of an interactive transaction.
  await db.$transaction(
    async (tx) => {
      await executeInOrder(tx, statementsOf(script));
    },
    { timeout: 600_000 }
  );
  await db.$executeRaw`UPDATE _prisma_migrations SET finished_at = CURRENT_TIMESTAMP, applied_steps_count = 1 WHERE id = ${id}`;
};

const applyInOrder = async (db: Database, [name, ...rest]: string[]) => {
  if (name === undefined) {
    return;
  }
  await applyMigration(db, name);
  await applyInOrder(db, rest);
};

/** Applies the migrations under `src/migrations` that the database has not finished, in name order. */
export const migrateDatabase = async (db: Database) => {
  await db.$executeRawUnsafe(historyTable);
  const finished = await db.$queryRaw<
    { migration_name: string }[]
  >`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
  const applied = new Set(finished.map((row) => row.migration_name));
  const entries = await readdir(migrationsFolder, { withFileTypes: true });
  await applyInOrder(
    db,
    entries
      .filter((entry) => entry.isDirectory() && !applied.has(entry.name))
      .map((entry) => entry.name)
      .toSorted()
  );
};
