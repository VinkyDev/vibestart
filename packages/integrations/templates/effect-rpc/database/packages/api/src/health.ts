import { sql } from "drizzle-orm";
import { Effect } from "effect";
import { HttpApiBuilder } from "effect/http-api";

import { Api, DatabaseUnavailable } from "@my-app/contracts";
import { Database } from "@my-app/db";

export const HealthLive = HttpApiBuilder.group(
  Api,
  "health",
  Effect.fnUntraced(function* (handlers) {
    const db = yield* Database;

    return handlers.handle("check", () =>
      db.execute(sql`select 1`).pipe(
        Effect.as({ status: "ok" as const }),
        Effect.tapError((cause) =>
          Effect.logWarning("Database health check failed", cause)
        ),
        Effect.mapError(() => new DatabaseUnavailable())
      )
    );
  })
);
