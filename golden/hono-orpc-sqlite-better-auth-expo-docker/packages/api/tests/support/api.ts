import { createRouterClient } from "@orpc/server";
import { afterAll } from "vite-plus/test";

import { createAuth } from "@my-app/auth";
import { createTestDatabase } from "@my-app/db/testing";

import { appRouter } from "#src/index.ts";
import type { Context } from "#src/index.ts";

// Each test file has a database of its own, so files run in parallel and share no rows.
const { db, remove } = await createTestDatabase();
afterAll(remove);

const auth = createAuth({
  baseURL: "http://localhost",
  db,
  secret: "test-secret-that-is-at-least-32-characters",
});

/** Calls the procedures in this process, through their middleware and validation, as the session's user. */
export const createClient = (session: Context["session"] = null) =>
  createRouterClient(appRouter, { context: { db, session } });

/** Signs a new user up through Better Auth and returns a client that calls as them. */
export const signUp = async () => {
  const { headers } = await auth.api.signUpEmail({
    body: {
      email: `${crypto.randomUUID()}@example.com`,
      name: "Test User",
      password: "correct-horse-battery",
    },
    returnHeaders: true,
  });
  const cookie = headers
    .getSetCookie()
    .map((header) => header.split(";")[0])
    .join("; ");
  return createClient(
    await auth.api.getSession({ headers: new Headers({ cookie }) })
  );
};
