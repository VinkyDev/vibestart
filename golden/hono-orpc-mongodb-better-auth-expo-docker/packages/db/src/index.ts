import mongoose from "mongoose";

import { todoSchema } from "#src/schema/todos.ts";

export { toTodo } from "#src/schema/todos.ts";

// `migrateDatabase` builds the indexes once, at deploy, rather than every connection at startup.
export const createDb = (url: string) => {
  const connection = mongoose.createConnection(url, { autoIndex: false });

  return { connection, todos: connection.model("Todo", todoSchema) };
};

export type Database = ReturnType<typeof createDb>;
