import "server-only";
import { proxy } from "hono/proxy";

import { readEnv } from "#src/server/env.ts";

export const proxyToServer = async (request: Request) => {
  const { pathname, search } = new URL(request.url);
  try {
    return await proxy(new URL(`${pathname}${search}`, readEnv().SERVER_URL), {
      raw: request,
      redirect: "manual",
    });
  } catch (error) {
    // The client went away, so no one reads the response; this is not a server error.
    if (request.signal.aborted) {
      return new Response(null, { status: 499 });
    }
    throw error;
  }
};
