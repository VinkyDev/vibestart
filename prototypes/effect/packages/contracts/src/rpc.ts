import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";

import { AuthMiddleware } from "#src/auth.ts";
import { Todo, TodoNotFound, TodoTitle } from "#src/todo.ts";

/** The app's own calls, served at `/rpc`. Every procedure needs a signed-in user. */
export class TodosRpcs extends RpcGroup.make(
  Rpc.make("todos.list", { success: Schema.Array(Todo) }),
  Rpc.make("todos.create", { payload: { title: TodoTitle }, success: Todo }),
  Rpc.make("todos.update", {
    error: TodoNotFound,
    payload: { completed: Schema.Boolean, id: Schema.Int },
    success: Todo,
  }),
  Rpc.make("todos.delete", {
    error: TodoNotFound,
    payload: { id: Schema.Int },
  })
).middleware(AuthMiddleware) {}
