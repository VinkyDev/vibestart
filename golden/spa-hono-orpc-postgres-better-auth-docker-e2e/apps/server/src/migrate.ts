import { createDb } from "@my-app/db";
import { migrateDatabase } from "@my-app/db/migrate";

import { env } from "#src/env.ts";

const db = createDb(env.DATABASE_URL);
await migrateDatabase(db);
await db.$client.end();
