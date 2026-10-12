import { createAuth } from "@my-app/auth";
import { createDb } from "@my-app/db";

import { env } from "#src/env.ts";

export const db = createDb(env.DATABASE_URL);

export const auth = createAuth({
  baseURL: env.BETTER_AUTH_URL,
  db,
  secret: env.BETTER_AUTH_SECRET,
});
