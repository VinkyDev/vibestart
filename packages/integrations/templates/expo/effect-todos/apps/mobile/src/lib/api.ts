import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { Atom, AtomHttpApi, AtomRpc, Reactivity } from "effect/reactivity";
import { RpcClient, RpcSerialization } from "effect/rpc";

import { Api, TodosRpcs } from "@my-app/contracts";

import { apiUrl } from "#src/env.ts";
import { authClient } from "#src/lib/auth-client.ts";

// Native fetch has no cookie jar: Better Auth's Expo client keeps the session, and each request sends it.
const HttpClientLive = FetchHttpClient.layer.pipe(
  Layer.provide(
    Layer.succeed(FetchHttpClient.Fetch, async (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("cookie", await authClient.getCookie());

      return await fetch(input, { ...init, credentials: "omit", headers });
    })
  )
);

class Rpc extends AtomRpc.Service<Rpc>()("@my-app/mobile/Rpc", {
  group: TodosRpcs,
  protocol: RpcClient.layerProtocolHttp({ url: `${apiUrl}/rpc` }).pipe(
    Layer.provide([RpcSerialization.layerNdjson, HttpClientLive])
  ),
}) {}

class HttpApi extends AtomHttpApi.Service<HttpApi>()("@my-app/mobile/HttpApi", {
  api: Api,
  baseUrl: apiUrl,
  httpClient: HttpClientLive,
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

      return yield* client("todos.update", { completed, id }).pipe(
        Reactivity.mutation(todosKeys)
      );
    })
  )
);

export const deleteTodoAtom = Atom.family((id: number) =>
  Rpc.runtime.fn(
    Effect.fnUntraced(function* () {
      const client = yield* Rpc;

      return yield* client("todos.delete", { id }).pipe(
        Reactivity.mutation(todosKeys)
      );
    })
  )
);

export const healthAtom = HttpApi.query("health", "check", {});
