import { Schema } from "effect";
import {
  HttpApi,
  HttpApiEndpoint,
  HttpApiGroup,
  OpenApi,
} from "effect/http-api";

export class DatabaseUnavailable extends Schema.TaggedError<DatabaseUnavailable>()(
  "DatabaseUnavailable",
  {},
  { httpApiStatus: 503 }
) {}

export class HealthGroup extends HttpApiGroup.make("health").add(
  HttpApiEndpoint.get("check", "/health", {
    error: DatabaseUnavailable,
    success: Schema.Struct({ status: Schema.Literal("ok") }),
  })
) {}

/** The public REST surface under `/api`, documented at `/api/openapi.json` and `/api/docs`. */
export class Api extends HttpApi.make("api")
  .add(HealthGroup)
  .prefix("/api")
  .annotate(OpenApi.Title, "my-app") {}
