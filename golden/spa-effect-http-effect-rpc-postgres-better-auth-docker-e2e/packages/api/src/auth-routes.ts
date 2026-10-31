import { Effect, Layer } from "effect";
import { HttpEffect, HttpRouter } from "effect/http";

import { Auth } from "@my-app/auth";

export const AuthRoutes = Layer.unwrap(
  Effect.gen(function* () {
    const auth = yield* Auth;

    return HttpRouter.add(
      "*",
      "/api/auth/*",
      HttpEffect.fromWebHandler(auth.handler)
    );
  })
);
