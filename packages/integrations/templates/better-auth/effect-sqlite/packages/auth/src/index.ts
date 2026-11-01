import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";
import { DatabaseSync } from "node:sqlite";

import { drizzle } from "drizzle-orm/node-sqlite";
import { Config, Context, Effect, Layer, Redacted, Schema } from "effect";

import { relations } from "@my-app/db/relations";
import * as schema from "@my-app/db/schema/auth";

interface AuthOptions {
  readonly baseURL: string;
  readonly databaseUrl: Redacted.Redacted;
  readonly secret: Redacted.Redacted;
}

// Better Auth expects the official synchronous/Promise adapter, not Effect queries.
const makeAuth = Effect.fn("Auth.make")(function* (options: AuthOptions) {
  const client = yield* Effect.acquireRelease(
    Effect.try(() => new DatabaseSync(Redacted.value(options.databaseUrl), { timeout: 5000 })),
    (database) => Effect.sync(() => { database.close(); })
  );

  yield* Effect.try(() => { client.exec("pragma journal_mode = wal"); });

  return betterAuth({
    baseURL: options.baseURL,
    database: drizzleAdapter(drizzle({ client, relations }), {
      provider: "sqlite",
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
