import { sql } from "drizzle-orm";
import { check, integer, snakeCase, text } from "drizzle-orm/sqlite-core";

export const todos = snakeCase.table(
  "todos",
  {
    completed: integer({ mode: "boolean" }).notNull().default(false),
    createdAt: integer({ mode: "timestamp_ms" })
      .notNull()
      .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`),
    id: integer().primaryKey({ autoIncrement: true }),
    title: text().notNull(),
  },
  (table) => [
    check(
      "todos_title_length",
      sql`length(trim(${table.title})) between 1 and 200`
    ),
  ]
);

export type Todo = typeof todos.$inferSelect;
