import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";
import { drizzle } from "drizzle-orm/postgres-js";
import { Config, Context, Effect, Layer, Redacted, Schema } from "effect";
import postgres from "postgres";

import { relations } from "@my-app/db/relations";
import * as schema from "@my-app/db/schema/auth";

interface AuthOptions {
  readonly baseURL: string;
  readonly databaseUrl: Redacted.Redacted;
  readonly secret: Redacted.Redacted;
}

// The Drizzle adapter takes a Promise-based database (better-auth#7234), so auth keeps a small pool of its own.
const makeAuth = Effect.fnUntraced(function* (options: AuthOptions) {
  const client = yield* Effect.acquireRelease(
    Effect.sync(() =>
      postgres(Redacted.value(options.databaseUrl), {
        connection: { client_min_messages: "warning" },
        max: 4,
      })
    ),
    (sql) =>
      Effect.promise(async () => {
        await sql.end();
      })
  );

  return betterAuth({
    baseURL: options.baseURL,
    database: drizzleAdapter(drizzle({ client, relations }), {
      provider: "pg",
      schema,
    }),
    emailAndPassword: { enabled: true },
    secret: Redacted.value(options.secret),
  });
});

export class Auth extends Context.Service<
  Auth,
  Effect.Success<ReturnType<typeof makeAuth>>
>()("@my-app/auth/Auth") {
  static readonly layer = (options: AuthOptions) =>
    Layer.effect(Auth, makeAuth(options));

  /** Reads `DATABASE_URL`, `BETTER_AUTH_URL`, and `BETTER_AUTH_SECRET`. */
  static readonly layerConfig = Layer.unwrap(
    Effect.map(
      Config.all({
        baseURL: Config.String("BETTER_AUTH_URL"),
        databaseUrl: Config.Redacted("DATABASE_URL"),
        secret: Config.schema(
          Schema.Redacted(Schema.String.check(Schema.isMinLength(32))),
          "BETTER_AUTH_SECRET"
        ),
      }),
      Auth.layer
    )
  );
}
