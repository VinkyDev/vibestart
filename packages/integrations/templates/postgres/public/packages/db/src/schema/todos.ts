import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  snakeCase,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const todos = snakeCase.table(
  "todos",
  {
    completed: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: text().notNull(),
  },
  (table) => [
    check(
      "todos_title_length",
      sql`char_length(btrim(${table.title})) between 1 and 200`
    ),
  ]
);

export type Todo = typeof todos.$inferSelect;
