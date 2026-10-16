import { Hono } from "hono";
import type { Context } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { services } from "#src/context.ts";
import type { AppEnv } from "#src/context.ts";
import { openApi, rpc } from "#src/orpc.ts";

const authHandler = async (c: Context<AppEnv>) =>
  await c.var.services.auth.handler(c.req.raw);

export const app = new Hono<AppEnv>()
  .use(logger())
  .use(secureHeaders())
  .use(services)
  .on(["GET", "POST"], "/api/auth/*", authHandler)
  .all("/rpc/*", rpc)
  .all("/api/*", openApi);
