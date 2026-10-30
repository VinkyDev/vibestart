import { Effect, Layer } from "effect";
import { HttpEffect, HttpRouter, HttpServerResponse } from "effect/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/http-api";
import { RpcSerialization, RpcServer } from "effect/rpc";

import { Auth } from "@my-app/auth";
import { Api, TodosRpcs } from "@my-app/contracts";

import { AuthMiddlewareLive } from "#src/auth-middleware.ts";
import { HealthLive } from "#src/health.ts";
import { TodosLive } from "#src/rpc.ts";
import { Todos } from "#src/todos.ts";

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
  Layer.provide([TodosLive, AuthMiddlewareLive, RpcSerialization.layerNdjson]),
  Layer.provide(Todos.layer)
);

/** The public REST API, its OpenAPI document, and the Scalar reference. */
const ApiRoutes = Layer.mergeAll(
  HttpApiBuilder.layer(Api, { openapiPath: "/api/openapi.json" }),
  HttpApiScalar.layer(Api, { path: "/api/docs" })
).pipe(Layer.provide(HealthLive));

/** Every route the server mounts. Needs `Database`, `Auth`, and the HTTP platform services. */
const SecurityHeaders = HttpRouter.middleware(
  (effect) =>
    Effect.map(
      effect,
      HttpServerResponse.setHeaders({
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "referrer-policy": "strict-origin-when-cross-origin",
      })
    ),
  { global: true }
);

export const Routes = Layer.mergeAll(
  AuthRoutes,
  RpcRoutes,
  ApiRoutes,
  SecurityHeaders
);
