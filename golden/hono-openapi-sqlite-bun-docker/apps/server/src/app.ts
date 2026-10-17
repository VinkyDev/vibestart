import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { createApi } from "@my-app/api";

import { services } from "#src/context.ts";
import type { AppEnv } from "#src/context.ts";

export const app = new Hono<AppEnv>()
  .use(logger())
  .use(secureHeaders())
  .use(services)
  .route("/api", createApi());
