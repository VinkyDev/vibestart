import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import type { Database } from "@my-app/db";
import * as schema from "@my-app/db/schema/auth";

interface AuthOptions {
  db: Database;
  baseURL: string;
  secret: string;
}

export const createAuth = ({ db, baseURL, secret }: AuthOptions) =>
  betterAuth({
    baseURL,
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    emailAndPassword: { enabled: true },
    plugins: [nextCookies()],
    secret,
  });

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];
