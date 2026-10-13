import { drizzle } from "drizzle-orm/node-sqlite";

import { relations } from "#src/relations.ts";

export const createDb = (path: string) => {
  const db = drizzle({ connection: { path, timeout: 5000 }, relations });
  db.$client.exec("pragma journal_mode = wal");
  return db;
};

export type Database = ReturnType<typeof createDb>;
