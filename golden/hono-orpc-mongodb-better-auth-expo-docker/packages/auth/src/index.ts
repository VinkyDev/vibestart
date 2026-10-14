import { expo } from "@better-auth/expo";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";

import type { Database } from "@my-app/db";

interface AuthOptions {
  db: Database;
  baseURL: string;
  secret: string;
}

export const createAuth = ({ db, baseURL, secret }: AuthOptions) =>
  betterAuth({
    baseURL,
    database: mongodbAdapter(db.connection.getClient().db()),
    emailAndPassword: { enabled: true },
    // The mobile app sends its scheme as the origin; the plugin also trusts exp:// when NODE_ENV is development.
    plugins: [expo()],
    secret,
    trustedOrigins: ["my-app://"],
  });

export type Auth = ReturnType<typeof createAuth>;

export type Session = Auth["$Infer"]["Session"];
