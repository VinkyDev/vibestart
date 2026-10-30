import { PgClient } from "@effect/sql-pg";
import { Config, Effect, Layer, Redacted } from "effect";
import { SqlClient } from "effect/sql";

import { Database } from "#src/index.ts";
import { migrateDatabase } from "#src/migrate.ts";
import { testDatabaseName } from "#src/test-database-name.ts";

const runAsAdmin = Effect.fn("TestDatabase.runAsAdmin")(
  (adminUrl: URL, statement: string) =>
    SqlClient.SqlClient.pipe(
      Effect.flatMap((sql) => sql.unsafe(statement)),
      Effect.provide(PgClient.layer({ url: Redacted.make(adminUrl.href) }))
    )
);

export const makeTestDatabase = Effect.gen(function* () {
  const adminUrl = new URL(
    Redacted.value(yield* Config.Redacted("DATABASE_URL"))
  );

  const name = testDatabaseName(adminUrl.pathname.slice(1));
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;

  yield* Effect.acquireRelease(
    runAsAdmin(adminUrl, `create database "${name}"`),
    () =>
      Effect.orDie(runAsAdmin(adminUrl, `drop database "${name}" with (force)`))
  );
  yield* migrateDatabase.pipe(
    Effect.provide(
      Database.layer.pipe(
        Layer.provide(PgClient.layer({ url: Redacted.make(url.href) }))
      )
    )
  );

  return Redacted.make(url.href);
});
