import "server-only";
import { createDb } from "@my-app/db";

import { readEnv } from "#src/server/env.ts";

const createServices = () => ({ db: createDb(readEnv().DATABASE_URL) });

let services: ReturnType<typeof createServices> | undefined;

export const getServices = () => {
  services ??= createServices();
  return services;
};
