import { getRequest } from "@tanstack/react-start/server";
import { env as bindings, waitUntil } from "cloudflare:workers";
import { env } from "void/env";

import { createAuth } from "@my-app/auth";
import type { Auth } from "@my-app/auth";
import { createDb } from "@my-app/db";
import type { Database } from "@my-app/db";

interface Services {
  auth: Auth;
  db: Database;
}

const requests = new WeakMap<Request, Services>();

export const getServices = () => {
  const services = requests.get(getRequest());

  if (services === undefined) {
    throw new Error("Services require the request middleware in src/start.ts");
  }

  return services;
};

export const withServices = async (
  request: Request,
  handle: (services: Services) => Promise<Response>
) => {
  const db = createDb(env.DATABASE_URL ?? bindings.HYPERDRIVE.connectionString);
  let streaming = false;

  const dispose = async () => {
    requests.delete(request);
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

    requests.set(request, services);

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
