import type { Auth } from "@my-app/auth";
import type { Database } from "@my-app/db";

export interface Services {
  auth: Auth;
  db: Database;
}

// The server sets `services` on every request before a route runs.
export interface ApiEnv {
  Variables: { services: Services };
}
