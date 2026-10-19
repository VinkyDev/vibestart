import { defineEnv } from "void/env";
import { z } from "zod";

export default defineEnv({
  DATABASE_URL: z.url().optional(),
  BETTER_AUTH_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
});
