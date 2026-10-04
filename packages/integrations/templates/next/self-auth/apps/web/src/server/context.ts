import "server-only";
import { createAuth } from "@my-app/auth";
import { createDb } from "@my-app/db";

import { readEnv } from "#src/server/env.ts";

const createServices = () => {
  const env = readEnv();
  const db = createDb(env.DATABASE_URL);
  const auth = createAuth({
    baseURL: env.BETTER_AUTH_URL,
    db,
    secret: env.BETTER_AUTH_SECRET,
  });
  return { auth, db };
};

let services: ReturnType<typeof createServices> | undefined;

export const getServices = () => {
  services ??= createServices();
  return services;
};
