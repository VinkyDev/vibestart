import { Effect } from "effect";
import { HealthRpcs } from "@my-app/contracts";

export const HealthRpcLive = HealthRpcs.toLayer({
  "health.check": () => Effect.succeed({ status: "ok" as const }),
});
