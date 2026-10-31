import { Schema } from "effect";
import { Rpc, RpcGroup } from "effect/rpc";

export class HealthRpcs extends RpcGroup.make(
  Rpc.make("health.check", { success: Schema.Struct({ status: Schema.Literal("ok") }) })
) {}
