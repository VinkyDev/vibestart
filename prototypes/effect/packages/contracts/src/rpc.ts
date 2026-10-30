import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";

import { AuthMiddleware } from "#src/auth.ts";
import { ServiceUnavailable } from "#src/errors.ts";
import { Todo, TodoId, TodoNotFound, TodoTitle } from "#src/todo.ts";

/** The app's own calls, served at `/rpc`. Every procedure needs a signed-in user. */
export class TodosRpcs extends RpcGroup.make(
  Rpc.make("todos.list", {
    error: ServiceUnavailable,
    success: Schema.Array(Todo),
  }),
  Rpc.make("todos.create", {
    error: ServiceUnavailable,
    payload: { title: TodoTitle },
    success: Todo,
  }),
  Rpc.make("todos.update", {
    error: Schema.Union([TodoNotFound, ServiceUnavailable]),
    payload: { completed: Schema.Boolean, id: TodoId },
    success: Todo,
  }),
  Rpc.make("todos.delete", {
    error: Schema.Union([TodoNotFound, ServiceUnavailable]),
    payload: { id: TodoId },
  })
).middleware(AuthMiddleware) {}
