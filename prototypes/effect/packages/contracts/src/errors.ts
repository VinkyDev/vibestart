import { Schema } from "effect";

/** Public errors deliberately carry no SQL, credentials, or internal causes. */
export class ServiceUnavailable extends Schema.TaggedError<ServiceUnavailable>()(
  "ServiceUnavailable",
  {},
  { httpApiStatus: 503 }
) {}

export class InternalServerError extends Schema.TaggedError<InternalServerError>()(
  "InternalServerError",
  {},
  { httpApiStatus: 500 }
) {}
