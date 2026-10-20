import { Effect, Layer } from "effect";

import { Auth } from "@my-app/auth";
import { AuthMiddleware, CurrentUser, Unauthorized } from "@my-app/contracts";

export const AuthMiddlewareLive = Layer.effect(
  AuthMiddleware,
  Effect.gen(function* () {
    const auth = yield* Auth;

    return (effect, { headers }) =>
      Effect.gen(function* () {
        const session = yield* Effect.promise(
          async () =>
            await auth.api.getSession({ headers: new Headers(headers) })
        );

        if (session === null) {
          return yield* new Unauthorized();
        }

        const { email, id, name } = session.user;

        return yield* Effect.provideService(effect, CurrentUser, {
          email,
          id,
          name,
        });
      });
  })
);
