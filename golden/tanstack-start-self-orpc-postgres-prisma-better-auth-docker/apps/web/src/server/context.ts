import { createAuth } from "@my-app/auth";
import { createDb } from "@my-app/db";

import { env } from "#src/server/env.ts";

const db = createDb(env.DATABASE_URL);

const services = {
  auth: createAuth({
    db,
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
  }),
  db,
};

// Callers ask for services per request, so a runtime that cannot share them across requests changes only this module.
export const getServices = () => services;
