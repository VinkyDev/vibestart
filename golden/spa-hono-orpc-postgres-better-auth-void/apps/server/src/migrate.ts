import { createDb } from "@my-app/db";
import { migrateDatabase } from "@my-app/db/migrate";

import { env } from "#src/node-env.ts";

const db = createDb(env.DATABASE_URL);

try {
  await migrateDatabase(db);
} finally {
  await db.$client.end();
}
