import { hc } from "hono/client";
import { afterAll } from "vite-plus/test";

import { createTestDatabase } from "@my-app/db/testing";

import { createApi } from "#src/index.ts";
import type { Api } from "#src/index.ts";

// Each test file has a database of its own, so files run in parallel and share no rows.
const { db, remove } = await createTestDatabase();
afterAll(remove);

export const api = createApi({ db });

/** Sends each request to the API in this process, through its routing, validation, and serialization. */
export const client = hc<Api>("http://localhost", { fetch: api.request });
