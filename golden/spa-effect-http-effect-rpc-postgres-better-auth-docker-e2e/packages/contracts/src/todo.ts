import { Schema } from "effect";

/** Normalize at the boundary; count Unicode code points, as PostgreSQL char_length does. */
export const TodoTitle = Schema.Trim.check(
  Schema.isPattern(/^.{1,200}$/su),
  Schema.makeFilter((title) => !title.includes("\0"))
);

export const TodoId = Schema.Int.check(
  Schema.isBetween({ minimum: 1, maximum: 2_147_483_647 })
);

export const Todo = Schema.Struct({
  completed: Schema.Boolean,
  createdAt: Schema.Date,
  id: TodoId,
  title: Schema.String,
});

export type Todo = typeof Todo.Type;

export class TodoNotFound extends Schema.TaggedError<TodoNotFound>()(
  "TodoNotFound",
  { id: TodoId }
) {}
