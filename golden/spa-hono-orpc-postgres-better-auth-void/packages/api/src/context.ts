import type { Session } from "@my-app/auth";
import type { Database } from "@my-app/db";

export interface Context {
  db: Database;
  session: Session | null;
}
