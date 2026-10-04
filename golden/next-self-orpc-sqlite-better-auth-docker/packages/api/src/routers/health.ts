import { sql } from "drizzle-orm";

import { publicProcedure } from "#src/procedures.ts";

export const health = publicProcedure
  .route({ method: "GET", path: "/health" })
  .handler(({ context }) => {
    context.db.run(sql`select 1`);
    return { status: "ok" as const };
  });
