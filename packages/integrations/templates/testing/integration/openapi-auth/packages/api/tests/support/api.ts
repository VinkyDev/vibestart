import { hc } from "hono/client";
import { afterAll } from "vite-plus/test";

import { createAuth } from "@my-app/auth";
import { createTestDatabase } from "@my-app/db/testing";

import { createApi } from "#src/index.ts";
import type { Api } from "#src/index.ts";

// Each test file has a database of its own, so files run in parallel and share no rows.
const { db, remove } = await createTestDatabase();
afterAll(remove);

const auth = createAuth({
  baseURL: "http://localhost",
  db,
  secret: "test-secret-that-is-at-least-32-characters",
});

export const api = createApi({ auth, db });

/** Sends each request to the API in this process, through its routing, validation, and serialization. */
export const createClient = (cookie?: string) =>
  hc<Api>("http://localhost", {
    fetch: api.request,
    headers: cookie === undefined ? {} : { cookie },
  });

/** Signs a new user up through Better Auth and returns a client that calls with their session cookie. */
export const signUp = async () => {
  const { headers } = await auth.api.signUpEmail({
    body: {
      email: `${crypto.randomUUID()}@example.com`,
      name: "Test User",
      password: "correct-horse-battery",
    },
    returnHeaders: true,
  });
  return createClient(
    headers
      .getSetCookie()
      .map((header) => header.split(";")[0])
      .join("; ")
  );
};
