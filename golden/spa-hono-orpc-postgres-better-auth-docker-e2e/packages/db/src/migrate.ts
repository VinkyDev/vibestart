import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import type { Database } from "#src/index.ts";

const migrationsFolder = fileURLToPath(new URL("migrations", import.meta.url));

export const migrateDatabase = async (db: Database) => {
  await migrate(db, { migrationsFolder });
};
