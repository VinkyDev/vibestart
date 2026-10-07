import { createRouterClient } from "@orpc/server";
import { afterAll } from "vite-plus/test";

import { createTestDatabase } from "@my-app/db/testing";

import { appRouter } from "#src/index.ts";

// Each test file has a database of its own, so files run in parallel and share no rows.
const { db, remove } = await createTestDatabase();
afterAll(remove);

/** Calls the procedures in this process, through their middleware and validation. */
export const client = createRouterClient(appRouter, { context: { db } });
