import { PgClient } from "@effect/sql-pg";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import type { Effect } from "effect";
import { Config, Context, Layer, Redacted } from "effect";

import { relations } from "#src/relations.ts";

const make = PgDrizzle.makeWithDefaults({ relations });

export class Database extends Context.Service<
  Database,
  Effect.Success<typeof make>
>()("@my-app/db/Database") {
  static readonly layer = Layer.effect(Database, make);

  static readonly layerUrl = (url: Redacted.Redacted) => Database.layer.pipe(
    Layer.provide(PgClient.layer({ url }))
  );

  static readonly layerConfig = Database.layer.pipe(
    Layer.provide(
      PgClient.layerConfig({ url: Config.Redacted("DATABASE_URL") })
    )
  );
}
