import { createDb } from "@my-app/db";

import { env } from "#src/server/env.ts";

export const db = createDb(env.DATABASE_URL);
