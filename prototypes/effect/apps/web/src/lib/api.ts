import { Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { AtomHttpApi, AtomRpc } from "effect/reactivity";
import { RpcClient, RpcSerialization } from "effect/rpc";

import { Api, TodosRpcs } from "@my-app/contracts";

const { origin } = window.location;

/** The app's procedures over `/rpc`; the session cookie rides along on same-origin requests. */
class Rpc extends AtomRpc.Service<Rpc>()("@my-app/web/Rpc", {
  group: TodosRpcs,
  protocol: RpcClient.layerProtocolHttp({ url: `${origin}/rpc` }).pipe(
    Layer.provide([RpcSerialization.layerNdjson, FetchHttpClient.layer])
  ),
}) {}

/** The public REST API under `/api`. */
class HttpApi extends AtomHttpApi.Service<HttpApi>()("@my-app/web/HttpApi", {
  api: Api,
  baseUrl: origin,
  httpClient: FetchHttpClient.layer,
}) {}

/** Mutations that pass these keys refresh every query that lists them. */
export const todosKeys = ["todos"];

export const todosAtom = Rpc.query("todos.list", undefined, {
  reactivityKeys: todosKeys,
});

export const createTodoAtom = Rpc.mutation("todos.create");

export const updateTodoAtom = Rpc.mutation("todos.update");

export const deleteTodoAtom = Rpc.mutation("todos.delete");

export const healthAtom = HttpApi.query("health", "check", {});
