import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";

import type { Database } from "@my-app/db";
import * as schema from "@my-app/db/schema/auth";
import { rendererOrigin } from "@my-app/electron";

interface AuthOptions {
  db: Database;
  baseURL: string;
  secret: string;
}

export const createAuth = ({ db, baseURL, secret }: AuthOptions) =>
  betterAuth({
    baseURL,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    secret,
    trustedOrigins: [rendererOrigin],
  });

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];
