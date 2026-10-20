import { Schema } from "effect";

/** Trimmed on decode, then bounded; the `todos_title_length` check holds the database to the same rule. */
export const TodoTitle = Schema.Trim.check(Schema.isBetweenLength(1, 200));

export const Todo = Schema.Struct({
  completed: Schema.Boolean,
  createdAt: Schema.Date,
  id: Schema.Int,
  title: Schema.String,
});

export type Todo = typeof Todo.Type;

export class TodoNotFound extends Schema.TaggedError<TodoNotFound>()(
  "TodoNotFound",
  { id: Schema.Int }
) {}
