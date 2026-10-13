import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const readEnv = () =>
  createEnv({
    emptyStringAsUndefined: true,
    runtimeEnv: process.env,
    server: {
      SERVER_URL: z.url().default("http://localhost:3001"),
    },
  });
