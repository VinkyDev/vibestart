import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const readEnv = () =>
  createEnv({
    emptyStringAsUndefined: true,
    runtimeEnv: process.env,
    server: {
      BETTER_AUTH_SECRET: z.string().min(32),
      BETTER_AUTH_URL: z.url(),
      DATABASE_URL: z.string().min(1),
    },
  });
