import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { CurrentUser, TodoNotFound, TodosRpcs } from "@my-app/contracts";
import { Database } from "@my-app/db";
import { todos } from "@my-app/db/schema/todos";

const columns = {
  completed: todos.completed,
  createdAt: todos.createdAt,
  id: todos.id,
  title: todos.title,
};

const ownedBy = (userId: string, id: number) =>
  and(eq(todos.id, id), eq(todos.userId, userId));

/** Someone else's row reads as missing, so the error does not reveal that the id exists. */
const firstOrNotFound = <A>([row]: readonly A[], id: number) =>
  row === undefined
    ? Effect.fail(new TodoNotFound({ id }))
    : Effect.succeed(row);

/** Each procedure reads and writes only the current user's rows; database failures are defects. */
export const TodosLive = TodosRpcs.toLayer(
  Effect.gen(function* () {
    const db = yield* Database;

    return {
      "todos.create": ({ title }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;

          const [todo] = yield* Effect.orDie(
            db
              .insert(todos)
              .values({ title, userId: user.id })
              .returning(columns)
          );

          return todo ?? (yield* Effect.die("insert returned no row"));
        }),

      "todos.delete": ({ id }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;

          const rows = yield* Effect.orDie(
            db.delete(todos).where(ownedBy(user.id, id)).returning(columns)
          );

          yield* firstOrNotFound(rows, id);
        }),

      "todos.list": () =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;

          return yield* Effect.orDie(
            db
              .select(columns)
              .from(todos)
              .where(eq(todos.userId, user.id))
              .orderBy(todos.id)
          );
        }),

      "todos.update": ({ completed, id }) =>
        Effect.gen(function* () {
          const user = yield* CurrentUser;

          const rows = yield* Effect.orDie(
            db
              .update(todos)
              .set({ completed })
              .where(ownedBy(user.id, id))
              .returning(columns)
          );

          return yield* firstOrNotFound(rows, id);
        }),
    };
  })
);
