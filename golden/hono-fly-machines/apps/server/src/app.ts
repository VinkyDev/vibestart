import { Hono } from "hono";
import type { Context } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

const health = (c: Context) => c.json({ status: "ok" });

export const app = new Hono()
  .use(logger())
  .use(secureHeaders())
  .get("/api/health", health);
