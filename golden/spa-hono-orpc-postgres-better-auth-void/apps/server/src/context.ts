import { env as bindings, waitUntil } from "cloudflare:workers";
import { env } from "void/env";

import { createAuth } from "@my-app/auth";
import type { Auth } from "@my-app/auth";
import { createDb } from "@my-app/db";
import type { Database } from "@my-app/db";

export interface Services {
  auth: Auth;
  db: Database;
}

export const withServices = async (
  handle: (services: Services) => Promise<Response>
) => {
  const db = createDb(env.DATABASE_URL ?? bindings.HYPERDRIVE.connectionString);
  let streaming = false;

  const dispose = async () => {
    await db.$client.end();
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

    if (response.body === null) {
      return response;
    }

    const { readable, writable } = new TransformStream<Uint8Array>();
    const forwarded = new Response(readable, response);
    const completed = response.body.pipeTo(writable).finally(dispose);
    streaming = true;
    waitUntil(completed);

    return forwarded;
  } finally {
    if (!streaming) {
      await dispose();
    }
  }
};
