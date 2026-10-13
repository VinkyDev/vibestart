import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  int,
  snakeCase,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

import { user } from "#src/schema/auth.ts";

export const todos = snakeCase.table(
  "todos",
  {
    completed: boolean().notNull().default(false),
    createdAt: timestamp({ fsp: 3 }).notNull().defaultNow(),
    id: int().autoincrement().primaryKey(),
    title: varchar({ length: 200 }).notNull(),
    userId: varchar({ length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("todos_user_id_idx").on(table.userId),
    check(
      "todos_title_length",
      sql`char_length(trim(${table.title})) between 1 and 200`
    ),
  ]
);

export type Todo = typeof todos.$inferSelect;
