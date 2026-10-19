import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { appRouter } from "@my-app/api";
import type { AppRouterClient } from "@my-app/api";

import { createContext } from "#src/server/orpc.ts";

const createClient = createIsomorphicFn()
  .server((): AppRouterClient =>
    createRouterClient(appRouter, {
      context: async () => await createContext(getRequestHeaders()),
    })
  )
  .client((): AppRouterClient =>
    createORPCClient(new RPCLink({ url: `${window.location.origin}/rpc` }))
  );

const client = createClient();

export const api = createTanstackQueryUtils(client);
