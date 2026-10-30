import { Context, Schema } from "effect";
import { RpcMiddleware } from "effect/rpc";

import { InternalServerError, ServiceUnavailable } from "#src/errors.ts";

/** The signed-in user, provided to every procedure behind `AuthMiddleware`. */
export class CurrentUser extends Context.Service<
  CurrentUser,
  { readonly id: string; readonly email: string; readonly name: string }
>()("@my-app/contracts/CurrentUser") {}

export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "Unauthorized",
  {},
  { httpApiStatus: 401 }
) {}

/** Resolves the Better Auth session from the request cookies, or fails with `Unauthorized`. */
export class AuthMiddleware extends RpcMiddleware.Service<
  AuthMiddleware,
  { provides: CurrentUser }
>()("@my-app/contracts/AuthMiddleware", {
  error: Schema.Union([Unauthorized, ServiceUnavailable, InternalServerError]),
}) {}
