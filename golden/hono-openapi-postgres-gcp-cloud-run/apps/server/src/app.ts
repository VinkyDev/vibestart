import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { createApi } from "@my-app/api";

import { db } from "#src/context.ts";

export const app = new Hono()
  .use(logger())
  .use(secureHeaders())
  .route("/api", createApi({ db }));
