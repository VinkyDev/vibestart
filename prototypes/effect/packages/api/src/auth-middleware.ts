import { Effect, Layer } from "effect";

import { Auth } from "@my-app/auth";
import {
  AuthMiddleware,
  CurrentUser,
  InternalServerError,
  ServiceUnavailable,
  Unauthorized,
} from "@my-app/contracts";

export const AuthMiddlewareLive = Layer.effect(
  AuthMiddleware,
  Effect.gen(function* () {
    const auth = yield* Auth;

    return (effect, { headers }) =>
      Effect.gen(function* () {
        const session = yield* Effect.tryPromise({
          try: async () =>
            await auth.api.getSession({ headers: new Headers(headers) }),
          catch: (cause) => cause,
        }).pipe(
          Effect.catch((error) =>
            Effect.logError("Session lookup failed", error).pipe(
              Effect.andThen(Effect.fail(new ServiceUnavailable()))
            )
          )
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
      }).pipe(
        // RPC defects otherwise serialize their message and cause. Keep those on the server.
        Effect.catchDefect((cause) =>
          Effect.logError("RPC defect", cause).pipe(
            Effect.andThen(Effect.fail(new InternalServerError()))
          )
        )
      );
  })
);
