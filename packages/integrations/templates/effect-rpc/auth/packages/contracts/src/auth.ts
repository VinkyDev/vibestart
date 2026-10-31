import { Context, Schema } from "effect";
import { RpcMiddleware } from "effect/rpc";

import { ServiceUnavailable } from "#src/errors.ts";

export class CurrentUser extends Context.Service<
  CurrentUser,
  { readonly id: string; readonly email: string; readonly name: string }
>()("@my-app/contracts/CurrentUser") {}

export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "Unauthorized",
  {},
  { httpApiStatus: 401 }
) {}

export class InternalServerError extends Schema.TaggedError<InternalServerError>()(
  "InternalServerError",
  {},
  { httpApiStatus: 500 }
) {}

export class AuthMiddleware extends RpcMiddleware.Service<
  AuthMiddleware,
  { provides: CurrentUser }
>()("@my-app/contracts/AuthMiddleware", {
  error: Schema.Union([Unauthorized, ServiceUnavailable, InternalServerError]),
}) {}
