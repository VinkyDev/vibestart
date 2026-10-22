import { drizzle } from "drizzle-orm/postgres-js";

import { relations } from "#src/relations.ts";

export const createDb = (url: string) =>
  drizzle({
    connection: {
      connection: { client_min_messages: "warning" },
      fetch_types: false,
      max: 5,
      url,
    },
    relations,
  });

export type Database = ReturnType<typeof createDb>;
