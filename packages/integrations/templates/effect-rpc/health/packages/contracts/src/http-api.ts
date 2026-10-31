import { Schema } from "effect";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from "effect/http-api";

export class HealthGroup extends HttpApiGroup.make("health").add(
  HttpApiEndpoint.get("check", "/health", {
    success: Schema.Struct({ status: Schema.Literal("ok") }),
  })
) {}

export class Api extends HttpApi.make("api")
  .add(HealthGroup)
  .prefix("/api")
  .annotate(OpenApi.Title, "my-app") {}
