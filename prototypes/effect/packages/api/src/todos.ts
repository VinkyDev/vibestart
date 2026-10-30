import { and, eq } from "drizzle-orm";
import { Context, Data, Effect, Layer } from "effect";

import { TodoNotFound } from "@my-app/contracts";
import type { Todo } from "@my-app/contracts";
import { Database } from "@my-app/db";
import { todos } from "@my-app/db/schema/todos";

export class TodoStorageError extends Data.TaggedError("TodoStorageError")<{
  readonly cause: unknown;
}> {}

const storageError = (cause: unknown) => new TodoStorageError({ cause });

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

/** Owns persistence and ownership rules, independent of the RPC transport. */
export class Todos extends Context.Service<
  Todos,
  {
    readonly list: (
      userId: string
    ) => Effect.Effect<readonly Todo[], TodoStorageError>;
    readonly create: (
      userId: string,
      title: string
    ) => Effect.Effect<Todo, TodoStorageError>;
    readonly update: (
      userId: string,
      id: number,
      completed: boolean
    ) => Effect.Effect<Todo, TodoStorageError | TodoNotFound>;
    readonly delete: (
      userId: string,
      id: number
    ) => Effect.Effect<void, TodoStorageError | TodoNotFound>;
  }
>()("@my-app/api/Todos") {
  static readonly layer = Layer.effect(
    Todos,
    Effect.gen(function* () {
      const db = yield* Database;

      return Todos.of({
        list: Effect.fn("Todos.list")(function* (userId) {
          return yield* db
            .select(columns)
            .from(todos)
            .where(eq(todos.userId, userId))
            .orderBy(todos.id)
            .pipe(Effect.mapError(storageError));
        }),
        create: Effect.fn("Todos.create")(function* (userId, title) {
          const [todo] = yield* db
            .insert(todos)
            .values({ title, userId })
            .returning(columns)
            .pipe(Effect.mapError(storageError));

          return todo ?? (yield* Effect.die("insert returned no row"));
        }),
        update: Effect.fn("Todos.update")(function* (userId, id, completed) {
          const rows = yield* db
            .update(todos)
            .set({ completed })
            .where(ownedBy(userId, id))
            .returning(columns)
            .pipe(Effect.mapError(storageError));

          return yield* firstOrNotFound(rows, id);
        }),
        delete: Effect.fn("Todos.delete")(function* (userId, id) {
          const rows = yield* db
            .delete(todos)
            .where(ownedBy(userId, id))
            .returning(columns)
            .pipe(Effect.mapError(storageError));

          yield* firstOrNotFound(rows, id);
        }),
      });
    })
  );
}
