import { Effect, Layer } from "effect";
import { HttpEffect, HttpRouter } from "effect/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/http-api";
import { RpcSerialization, RpcServer } from "effect/rpc";

import { Auth } from "@my-app/auth";
import { Api, TodosRpcs } from "@my-app/contracts";

import { AuthMiddlewareLive } from "#src/auth-middleware.ts";
import { HealthLive } from "#src/health.ts";
import { TodosLive } from "#src/todos.ts";

/** Better Auth answers every method under `/api/auth/*` with its own Fetch handler. */
const AuthRoutes = Layer.unwrap(
  Effect.gen(function* () {
    const auth = yield* Auth;

    return HttpRouter.add(
      "*",
      "/api/auth/*",
      HttpEffect.fromWebHandler(auth.handler)
    );
  })
);

/** The app's procedures at `/rpc`, as NDJSON over HTTP. */
const RpcRoutes = RpcServer.layerHttp({
  group: TodosRpcs,
  path: "/rpc",
  protocol: "http",
}).pipe(
  Layer.provide([TodosLive, AuthMiddlewareLive, RpcSerialization.layerNdjson])
);

/** The public REST API, its OpenAPI document, and the Scalar reference. */
const ApiRoutes = Layer.mergeAll(
  HttpApiBuilder.layer(Api, { openapiPath: "/api/openapi.json" }),
  HttpApiScalar.layer(Api, { path: "/api/docs" })
).pipe(Layer.provide(HealthLive));

/** Every route the server mounts. Needs `Database`, `Auth`, and the HTTP platform services. */
export const Routes = Layer.mergeAll(AuthRoutes, RpcRoutes, ApiRoutes);
