import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/effect-postgres/migrator";
import { Effect } from "effect";

import { Database } from "#src/index.ts";

// The server bundle copies the folder beside `dist/migrate.mjs`, so this resolves from source and from the bundle.
const migrationsFolder = fileURLToPath(new URL("migrations", import.meta.url));

export const migrateDatabase = Effect.gen(function* () {
  const db = yield* Database;

  yield* migrate(db, { migrationsFolder });
}).pipe(Effect.withSpan("migrateDatabase"));
