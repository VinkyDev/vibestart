import "server-only";
import type { AppRouterClient } from "@my-app/api";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClient } from "@tanstack/react-query";
import { headers } from "next/headers";
import { cache } from "react";

import { readEnv } from "#src/server/env.ts";

// Server Components call the API server directly, with the visitor's cookies.
const serverClient: AppRouterClient = createORPCClient(
  new RPCLink({
    headers: async () => {
      const requestHeaders = await headers();
      return { cookie: requestHeaders.get("cookie") ?? "" };
    },
    url: () => `${readEnv().SERVER_URL}/rpc`,
  })
);

export const serverApi = createTanstackQueryUtils(serverClient);

export const getQueryClient = cache(() => new QueryClient());
