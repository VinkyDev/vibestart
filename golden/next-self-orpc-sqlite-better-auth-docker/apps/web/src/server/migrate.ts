import { createDb } from "@my-app/db";
import { migrateDatabase } from "@my-app/db/migrate";

import { readEnv } from "#src/server/env.ts";

const db = createDb(readEnv().DATABASE_URL);
migrateDatabase(db);
db.$client.close();
