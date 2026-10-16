import { createMiddleware } from "hono/factory";

import { createDb } from "@my-app/db";

import { env } from "#src/env.ts";

export const db = createDb(env.DATABASE_URL);

export interface AppEnv {
  Variables: { services: { db: typeof db } };
}

// Handlers read services from the request, so a runtime that cannot share them across requests changes only this middleware.
export const services = createMiddleware<AppEnv>(async (c, next) => {
  c.set("services", { db });
  await next();
});
