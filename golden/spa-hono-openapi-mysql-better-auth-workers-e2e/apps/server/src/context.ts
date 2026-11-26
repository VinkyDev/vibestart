import { env as bindings, waitUntil } from "cloudflare:workers";

import { createAuth } from "@my-app/auth";
import type { Auth } from "@my-app/auth";
import { createDb } from "@my-app/db";
import type { Database } from "@my-app/db";

import { readEnv } from "../env.ts";

export interface Services {
  auth: Auth;
  db: Database;
}

export const withServices = async (
  handle: (services: Services) => Promise<Response>
) => {
  const env = readEnv(bindings);
  const db = createDb(env.DATABASE_URL);
  let streaming = false;

  const dispose = async () => {
    await db.$client.promise().end();
  };

  try {
    const services = {
      auth: createAuth({
        baseURL: env.BETTER_AUTH_URL,
        db,
        secret: env.BETTER_AUTH_SECRET,
      }),
      db,
    };

    const response = await handle(services);

    const { body } = response;

    if (body === null) {
      return response;
    }

    const { readable, writable } = new TransformStream<Uint8Array>();
    const forwarded = new Response(readable, response);

    const transfer = async () => {
      try {
        await body.pipeTo(writable);
      } finally {
        await dispose();
      }
    };

    streaming = true;
    waitUntil(transfer());

    return forwarded;
  } finally {
    if (!streaming) {
      await dispose();
    }
  }
};
