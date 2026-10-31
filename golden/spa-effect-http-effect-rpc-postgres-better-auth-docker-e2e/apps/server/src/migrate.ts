import { NodeRuntime } from "@effect/platform-node";
import { Effect } from "effect";

import { Database } from "@my-app/db";
import { migrateDatabase } from "@my-app/db/migrate";

NodeRuntime.runMain(migrateDatabase.pipe(Effect.provide(Database.layerConfig)));
