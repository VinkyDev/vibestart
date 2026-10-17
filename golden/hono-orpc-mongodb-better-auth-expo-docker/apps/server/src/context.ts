import { createMiddleware } from "hono/factory";

import { createAuth } from "@my-app/auth";
import { createDb } from "@my-app/db";

import { env } from "#src/env.ts";

export const db = createDb(env.DATABASE_URL);

const auth = createAuth({
  baseURL: env.BETTER_AUTH_URL,
  db,
  secret: env.BETTER_AUTH_SECRET,
});

export interface AppEnv {
  Variables: { services: { auth: typeof auth; db: typeof db } };
}

// Handlers read services from the request, so a runtime that cannot share them across requests changes only this middleware.
export const services = createMiddleware<AppEnv>(async (c, next) => {
  c.set("services", { auth, db });
  await next();
});
