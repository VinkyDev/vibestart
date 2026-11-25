import { Hono } from "hono";
import type { Context } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { createApi } from "@my-app/api";

import type { Services } from "#src/context.ts";

export const createApp = ({ auth, db }: Services) => {
  const authHandler = async (c: Context) => await auth.handler(c.req.raw);

  return new Hono()
    .use(logger())
    .use(secureHeaders())
    .on(["GET", "POST"], "/api/auth/*", authHandler)
    .route("/api", createApi({ auth, db }));
};
