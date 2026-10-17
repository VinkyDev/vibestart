import type { Database } from "@my-app/db";

export interface Services {
  db: Database;
}

// The server sets `services` on every request before a route runs.
export interface ApiEnv {
  Variables: { services: Services };
}
