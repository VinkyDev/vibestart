import { Hono } from "hono";
import type { Context } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import type { Services } from "#src/context.ts";
import { createRpc } from "#src/orpc.ts";

export const createApp = ({ auth, db }: Services) => {
  const { rpc, openApi } = createRpc({ auth, db });

  const authHandler = async (c: Context) => await auth.handler(c.req.raw);

  return new Hono()
    .use(logger())
    .use(secureHeaders())
    .on(["GET", "POST"], "/api/auth/*", authHandler)
    .all("/api/rpc/*", rpc)
    .all("/api/*", openApi);
};
