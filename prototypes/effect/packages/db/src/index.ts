import { PgClient } from "@effect/sql-pg";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import type { Effect } from "effect";
import { Config, Context, Layer } from "effect";

import { relations } from "#src/relations.ts";

const make = PgDrizzle.makeWithDefaults({ relations });

/** Drizzle over the `@effect/sql-pg` pool: every query is an `Effect`, so handlers `yield*` it. */
export class Database extends Context.Service<
  Database,
  Effect.Success<typeof make>
>()("@my-app/db/Database") {
  /** Needs a `PgClient`; tests provide one for a database of their own. */
  static readonly layer = Layer.effect(Database, make);

  /** Connects to `DATABASE_URL`. */
  static readonly layerConfig = Database.layer.pipe(
    Layer.provide(
      PgClient.layerConfig({ url: Config.Redacted("DATABASE_URL") })
    )
  );
}
