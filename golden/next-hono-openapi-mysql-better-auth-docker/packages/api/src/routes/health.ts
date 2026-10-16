import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { sql } from "drizzle-orm";

import type { ApiEnv } from "#src/services.ts";

const health = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": { schema: z.object({ status: z.literal("ok") }) },
      },
      description: "The server and MySQL answer",
    },
  },
});

export const healthRoutes = () =>
  new OpenAPIHono<ApiEnv>().openapi(health, async (c) => {
    await c.var.services.db.execute(sql`select 1`);

    return c.json({ status: "ok" as const }, 200);
  });
