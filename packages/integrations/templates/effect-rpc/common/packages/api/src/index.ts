import { Effect, Layer } from "effect";
import {
  HttpEffect,
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from "effect/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/http-api";
import { RpcSerialization, RpcServer } from "effect/rpc";

import { Auth } from "@my-app/auth";
import { Api, TodosRpcs } from "@my-app/contracts";

import { AuthMiddlewareLive } from "#src/auth-middleware.ts";
import { HealthLive } from "#src/health.ts";
import { TodosLive } from "#src/rpc.ts";
import { Todos } from "#src/todos.ts";

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

const RpcOrigin = Layer.unwrap(
  Effect.map(Auth, (auth) => {
    const allowedOrigin = new URL(auth.options.baseURL).origin;

    return HttpRouter.middleware((httpEffect) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const { origin } = request.headers;

        if (origin !== undefined && origin !== allowedOrigin) {
          return HttpServerResponse.empty({ status: 403 });
        }

        return yield* httpEffect;
      })
    ).layer;
  })
);

const RpcRoutes = RpcServer.layerHttp({
  group: TodosRpcs,
  path: "/rpc",
  protocol: "http",
}).pipe(
  Layer.provide([
    TodosLive,
    AuthMiddlewareLive,
    RpcSerialization.layerNdjson,
    RpcOrigin,
  ]),
  Layer.provide(Todos.layer)
);

const ApiRoutes = Layer.mergeAll(
  HttpApiBuilder.layer(Api, { openapiPath: "/api/openapi.json" }),
  HttpApiScalar.layer(Api, { path: "/api/docs" })
).pipe(Layer.provide(HealthLive));

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
