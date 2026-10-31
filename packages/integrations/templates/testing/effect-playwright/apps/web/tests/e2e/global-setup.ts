import { NodeServices } from "@effect/platform-node";
import { Effect, Exit, Layer, Scope } from "effect";

import { testServer } from "../support/server.ts";

export default async function setup() {
  const scope = Effect.runSync(Scope.make());
  const close = Scope.close(scope, Exit.void);

  await Effect.runPromise(Effect.gen(function* () {
    const services = yield* Layer.buildWithScope(NodeServices.layer, scope);

    yield* testServer.pipe(Effect.provideContext(services));
  }).pipe(Scope.provide(scope), Effect.onError(() => close)));

  return async () => { await Effect.runPromise(close); };
}
