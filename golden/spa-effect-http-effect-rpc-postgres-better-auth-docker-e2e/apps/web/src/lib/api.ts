import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { Atom, AtomHttpApi, AtomRpc, Reactivity } from "effect/reactivity";
import { RpcClient, RpcSerialization } from "effect/rpc";

import { Api, TodosRpcs } from "@my-app/contracts";

const { origin } = window.location;

class Rpc extends AtomRpc.Service<Rpc>()("@my-app/web/Rpc", {
  group: TodosRpcs,
  protocol: RpcClient.layerProtocolHttp({ url: `${origin}/rpc` }).pipe(
    Layer.provide([RpcSerialization.layerNdjson, FetchHttpClient.layer])
  ),
}) {}

class HttpApi extends AtomHttpApi.Service<HttpApi>()("@my-app/web/HttpApi", {
  api: Api,
  baseUrl: origin,
  httpClient: FetchHttpClient.layer,
}) {}

export const todosKeys = ["todos"];

export const todosAtom = Rpc.query("todos.list", undefined, {
  reactivityKeys: todosKeys,
});

export const createTodoAtom = Rpc.mutation("todos.create");

// Each row owns a mutation fiber: writing another row must not interrupt it.
export const updateTodoAtom = Atom.family((id: number) =>
  Rpc.runtime.fn<boolean>()(
    Effect.fnUntraced(function* (completed) {
      const client = yield* Rpc;

      return yield* client("todos.update", { id, completed }).pipe(
        Reactivity.mutation(todosKeys)
      );
    })
  )
);

export const deleteTodoAtom = Atom.family((id: number) =>
  Rpc.runtime.fn<void>()(
    Effect.fnUntraced(function* () {
      const client = yield* Rpc;

      return yield* client("todos.delete", { id }).pipe(
        Reactivity.mutation(todosKeys)
      );
    })
  )
);

export const healthAtom = HttpApi.query("health", "check", {});
