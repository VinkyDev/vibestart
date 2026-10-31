import { Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { AtomRpc } from "effect/reactivity";
import { RpcClient, RpcSerialization } from "effect/rpc";

import { HealthRpcs } from "@my-app/contracts";

class Rpc extends AtomRpc.Service<Rpc>()("@my-app/web/Rpc", {
  group: HealthRpcs,
  protocol: RpcClient.layerProtocolHttp({ url: `${window.location.origin}/rpc` }).pipe(
    Layer.provide([RpcSerialization.layerNdjson, FetchHttpClient.layer])
  ),
}) {}

export const healthAtom = Rpc.query("health.check", undefined);
