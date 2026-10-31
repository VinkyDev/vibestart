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
      "todos.list": () =>
        CurrentUser.use((user) => todos.list(user.id)).pipe(
          Effect.catchTag("TodoStorageError", unavailable)
        ),
      "todos.create": ({ title }) =>
        CurrentUser.use((user) => todos.create(user.id, title)).pipe(
          Effect.catchTag("TodoStorageError", unavailable)
        ),
      "todos.update": ({ id, completed }) =>
        CurrentUser.use((user) => todos.update(user.id, id, completed)).pipe(
          Effect.catchTag("TodoStorageError", unavailable)
        ),
      "todos.delete": ({ id }) =>
        CurrentUser.use((user) => todos.delete(user.id, id)).pipe(
          Effect.catchTag("TodoStorageError", unavailable)
        ),
    };
  })
);
