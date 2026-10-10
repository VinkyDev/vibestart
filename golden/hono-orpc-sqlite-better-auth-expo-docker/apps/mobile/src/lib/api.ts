import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { AppRouterClient } from "@my-app/api";

import { apiUrl } from "#src/env.ts";
import { authClient } from "#src/lib/auth-client.ts";

const link = new RPCLink({
  // Native fetch has no cookie jar: Better Auth's Expo client keeps the session, and each request sends it.
  fetch: async (input, init) =>
    await fetch(input, { ...init, credentials: "omit" }),
  headers: async () => ({ cookie: await authClient.getCookie() }),
  url: `${apiUrl}/rpc`,
});

const client: AppRouterClient = createORPCClient(link);

export const api = createTanstackQueryUtils(client);
