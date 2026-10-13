import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/node-sqlite/migrator";

import type { Database } from "#src/index.ts";

const migrationsFolder = fileURLToPath(new URL("migrations", import.meta.url));

export const migrateDatabase = (db: Database) => {
  migrate(db, { migrationsFolder });
};
