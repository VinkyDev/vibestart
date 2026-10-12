import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  snakeCase,
  text,
} from "drizzle-orm/sqlite-core";

import { user } from "#src/schema/auth.ts";

export const todos = snakeCase.table(
  "todos",
  {
    completed: integer({ mode: "boolean" }).notNull().default(false),
    createdAt: integer({ mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`),
    id: integer().primaryKey({ autoIncrement: true }),
    title: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("todos_user_id_idx").on(table.userId),
    check(
      "todos_title_length",
      sql`length(trim(${table.title})) between 1 and 200`
    ),
  ]
);

export type Todo = typeof todos.$inferSelect;
