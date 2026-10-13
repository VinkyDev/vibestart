import { drizzle } from "drizzle-orm/mysql2";

import { relations } from "#src/relations.ts";

export const createDb = (url: string) => drizzle({ connection: url, relations });

export type Database = ReturnType<typeof createDb>;
