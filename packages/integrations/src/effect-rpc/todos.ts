import type { Context } from "@vibestart/core";
import { file } from "@vibestart/core";

export const todoService = (ctx: Context) => {
  const auth = ctx.has("better-auth");

  return file(
    "packages/api/src/todos.ts",
    `import { ${auth ? "and, " : ""}eq } from "drizzle-orm";
import { Context, Data, Effect, Layer } from "effect";

import { TodoNotFound } from "${ctx.scope}/contracts";
import type { Todo } from "${ctx.scope}/contracts";
import { Database } from "${ctx.scope}/db";
import { todos } from "${ctx.scope}/db/schema/todos";

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

${
  auth
    ? `const ownedBy = (userId: string, id: number) =>
  and(eq(todos.id, id), eq(todos.userId, userId));

// Someone else's row reads as missing, so the error does not reveal that the id exists.
`
    : ""
}const firstOrNotFound = <A>([row]: readonly A[], id: number) =>
  row === undefined
    ? Effect.fail(new TodoNotFound({ id }))
    : Effect.succeed(row);

export class Todos extends Context.Service<
  Todos,
  {
    readonly list: (
      ${auth ? "userId: string" : ""}
    ) => Effect.Effect<readonly Todo[], TodoStorageError>;
    readonly create: (
      ${auth ? "userId: string," : ""}
      title: string
    ) => Effect.Effect<Todo, TodoStorageError>;
    readonly update: (
      ${auth ? "userId: string," : ""}
      id: number,
      completed: boolean
    ) => Effect.Effect<Todo, TodoStorageError | TodoNotFound>;
    readonly delete: (
      ${auth ? "userId: string," : ""}
      id: number
    ) => Effect.Effect<void, TodoStorageError | TodoNotFound>;
  }
>()("${ctx.scope}/api/Todos") {
  static readonly layer = Layer.effect(
    Todos,
    Effect.gen(function* () {
      const db = yield* Database;

      return Todos.of({
        list: Effect.fn("Todos.list")(function* (${auth ? "userId" : ""}) {
          return yield* db
            .select(columns)
            .from(todos)${auth ? "\n            .where(eq(todos.userId, userId))" : ""}
            .orderBy(todos.id)
            .pipe(Effect.mapError(storageError));
        }),
        create: Effect.fn("Todos.create")(function* (${auth ? "userId, " : ""}title) {
          const [todo] = yield* db
            .insert(todos)
            .values({ title${auth ? ", userId" : ""} })
            .returning(columns)
            .pipe(Effect.mapError(storageError));

          return todo ?? (yield* Effect.die("insert returned no row"));
        }),
        update: Effect.fn("Todos.update")(function* (${auth ? "userId, " : ""}id, completed) {
          const rows = yield* db
            .update(todos)
            .set({ completed })
            .where(${auth ? "ownedBy(userId, id)" : "eq(todos.id, id)"})
            .returning(columns)
            .pipe(Effect.mapError(storageError));

          return yield* firstOrNotFound(rows, id);
        }),
        delete: Effect.fn("Todos.delete")(function* (${auth ? "userId, " : ""}id) {
          const rows = yield* db
            .delete(todos)
            .where(${auth ? "ownedBy(userId, id)" : "eq(todos.id, id)"})
            .returning(columns)
            .pipe(Effect.mapError(storageError));

          yield* firstOrNotFound(rows, id);
        }),
      });
    })
  );
}
`
  );
};

export const todoHandlers = (ctx: Context) => {
  const auth = ctx.has("better-auth");

  return file(
    "packages/api/src/rpc.ts",
    `import { Effect } from "effect";

import { ${auth ? "CurrentUser, " : ""}ServiceUnavailable, TodosRpcs } from "${ctx.scope}/contracts";

import { Todos } from "#src/todos.ts";
import type { TodoStorageError } from "#src/todos.ts";

const unavailable = (error: TodoStorageError) =>
  Effect.logError("Todo storage failed", error).pipe(
    Effect.andThen(Effect.fail(new ServiceUnavailable()))
  );

export const TodosLive = TodosRpcs.toLayer(
  Effect.gen(function* () {
    const todos = yield* Todos;

    return {
      "todos.list": Effect.fnUntraced(function* () {
        ${auth ? "const user = yield* CurrentUser;" : ""}

        return yield* todos.list(${auth ? "user.id" : ""});
      }, Effect.catchTag("TodoStorageError", unavailable)),
      "todos.create": Effect.fnUntraced(function* ({ title }) {
        ${auth ? "const user = yield* CurrentUser;" : ""}

        return yield* todos.create(${auth ? "user.id, " : ""}title);
      }, Effect.catchTag("TodoStorageError", unavailable)),
      "todos.update": Effect.fnUntraced(function* ({ id, completed }) {
        ${auth ? "const user = yield* CurrentUser;" : ""}

        return yield* todos.update(${auth ? "user.id, " : ""}id, completed);
      }, Effect.catchTag("TodoStorageError", unavailable)),
      "todos.delete": Effect.fnUntraced(function* ({ id }) {
        ${auth ? "const user = yield* CurrentUser;" : ""}

        return yield* todos.delete(${auth ? "user.id, " : ""}id);
      }, Effect.catchTag("TodoStorageError", unavailable)),
    };
  })
);
`
  );
};
