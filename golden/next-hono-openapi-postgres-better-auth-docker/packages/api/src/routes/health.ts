import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";

import type { Services } from "#src/services.ts";

const health = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ status: z.literal("ok") }) },
      },
      description: "The server and PostgreSQL answer",
    },
  },
});

export const healthRoutes = ({ db }: Services) =>
  new OpenAPIHono().openapi(health, async (c) => {
    await db.execute(sql`select 1`);
    return c.json({ status: "ok" as const }, 200);
  });
