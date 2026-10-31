import { Effect } from "effect";

import { CurrentUser, ServiceUnavailable, TodosRpcs } from "@my-app/contracts";

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
      "todos.list": Effect.fnUntraced(
        function* () {
          const user = yield* CurrentUser;

          return yield* todos.list(user.id);
        },
        Effect.catchTag("TodoStorageError", unavailable)
      ),
      "todos.create": Effect.fnUntraced(
        function* ({ title }) {
          const user = yield* CurrentUser;

          return yield* todos.create(user.id, title);
        },
        Effect.catchTag("TodoStorageError", unavailable)
      ),
      "todos.update": Effect.fnUntraced(
        function* ({ id, completed }) {
          const user = yield* CurrentUser;

          return yield* todos.update(user.id, id, completed);
        },
        Effect.catchTag("TodoStorageError", unavailable)
      ),
      "todos.delete": Effect.fnUntraced(
        function* ({ id }) {
          const user = yield* CurrentUser;

          return yield* todos.delete(user.id, id);
        },
        Effect.catchTag("TodoStorageError", unavailable)
      ),
    };
  })
);
