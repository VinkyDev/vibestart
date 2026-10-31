import { SqliteClient } from "@effect/sql-sqlite-node";
import * as SqliteDrizzle from "drizzle-orm/effect-sqlite-node";
import type { Effect } from "effect";
import { Config, Context, Layer, Redacted } from "effect";

import { relations } from "#src/relations.ts";

const make = SqliteDrizzle.makeWithDefaults({ relations });

export class Database extends Context.Service<
  Database,
  Effect.Success<typeof make>
>()("@my-app/db/Database") {
  static readonly layer = Layer.effect(Database, make);

  static readonly layerUrl = (url: Redacted.Redacted) => Database.layer.pipe(
    Layer.provide(SqliteClient.layer({ filename: Redacted.value(url) }))
  );

  static readonly layerConfig = Database.layer.pipe(
    Layer.provide(
      SqliteClient.layerConfig({ filename: Config.String("DATABASE_URL") })
    )
  );
}
