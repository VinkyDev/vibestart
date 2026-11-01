import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";
import { Api } from "@my-app/contracts";

export const HealthLive = HttpApiBuilder.group(Api, "health", (handlers) =>
  handlers.handle("check", () => Effect.succeed({ status: "ok" as const }))
);
