import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import type { Database } from "@my-app/db";

interface AuthOptions {
  db: Database;
  baseURL: string;
  secret: string;
}

export const createAuth = ({ db, baseURL, secret }: AuthOptions) =>
  betterAuth({
    baseURL,
    database: prismaAdapter(db, { provider: "postgresql" }),
    emailAndPassword: { enabled: true },
    plugins: [tanstackStartCookies()],
    secret,
  });

export type Auth = ReturnType<typeof createAuth>;

export type Session = Auth["$Infer"]["Session"];
