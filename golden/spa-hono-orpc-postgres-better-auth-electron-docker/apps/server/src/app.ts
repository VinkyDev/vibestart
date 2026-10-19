import { Hono } from "hono";
import type { Context } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { auth } from "#src/context.ts";
import { openApi, rpc } from "#src/orpc.ts";

const authHandler = async (c: Context) => await auth.handler(c.req.raw);

export const app = new Hono()
  .use(logger())
  .use(secureHeaders())
  .on(["GET", "POST"], "/api/auth/*", authHandler)
  .all("/rpc/*", rpc)
  .all("/api/*", openApi);
