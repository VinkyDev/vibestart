import type { Auth } from "@my-app/auth";
import type { Database } from "@my-app/db";

export interface Services {
  auth: Auth;
  db: Database;
}
