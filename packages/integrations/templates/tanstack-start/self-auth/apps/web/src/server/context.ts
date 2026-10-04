import { createAuth } from "@my-app/auth";
import { createDb } from "@my-app/db";

import { env } from "#src/server/env.ts";

export const db = createDb(env.DATABASE_URL);

export const auth = createAuth({
  db,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
});
