import { publicProcedure } from "#src/procedures.ts";

export const health = publicProcedure
  .route({ method: "GET", path: "/health" })
  .handler(async ({ context }) => {
    await context.db.connection.getClient().db().command({ ping: 1 });
    return { status: "ok" as const };
  });
