import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";

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
    // The mobile app sends its scheme as the origin; the plugin also trusts exp:// when NODE_ENV is development.
    plugins: [expo()],
    secret,
    trustedOrigins: ["my-app://"],
  });

export type Auth = ReturnType<typeof createAuth>;
export type Session = Auth["$Infer"]["Session"];
