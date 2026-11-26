import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  snakeCase,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "#src/schema/auth.ts";

export const todos = snakeCase.table(
  "todos",
  {
    completed: boolean().notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: text().notNull(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("todos_user_id_idx").on(table.userId),
    check(
      "todos_title_length",
      sql`char_length(btrim(${table.title})) between 1 and 200`
    ),
  ]
);

export type Todo = typeof todos.$inferSelect;
