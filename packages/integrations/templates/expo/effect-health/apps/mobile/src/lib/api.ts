import { Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { AtomRpc } from "effect/reactivity";
import { RpcClient, RpcSerialization } from "effect/rpc";

import { HealthRpcs } from "@my-app/contracts";

import { apiUrl } from "#src/env.ts";

// Native fetch has no browser origin; omit credentials so requests stay stateless.
const HttpClientLive = FetchHttpClient.layer.pipe(
  Layer.provide(
    Layer.succeed(FetchHttpClient.RequestInit, { credentials: "omit" })
  )
);

class Rpc extends AtomRpc.Service<Rpc>()("@my-app/mobile/Rpc", {
  group: HealthRpcs,
  protocol: RpcClient.layerProtocolHttp({ url: `${apiUrl}/rpc` }).pipe(
    Layer.provide([RpcSerialization.layerNdjson, HttpClientLive])
  ),
}) {}

export const healthAtom = Rpc.query("health.check", undefined);
