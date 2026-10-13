import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";

import { relations } from "#src/relations.ts";

// drizzle-orm sets options on `client.config` and wraps the pool with `promise()`, which a `mysql2/promise` pool
// lacks. Close it with `db.$client.promise().end()`.
export const createDb = (url: string) =>
  drizzle({ client: createPool({ uri: url }), relations });

export type Database = ReturnType<typeof createDb>;
