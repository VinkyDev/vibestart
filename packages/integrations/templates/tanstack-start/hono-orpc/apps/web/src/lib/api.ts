import type { AppRouterClient } from "@my-app/api";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { env } from "#src/server/env.ts";

// During SSR the web server calls the API server directly, with the visitor's cookies.
const createClient = createIsomorphicFn()
  .server((): AppRouterClient =>
    createORPCClient(
      new RPCLink({
        url: `${env.SERVER_URL}/rpc`,
        headers: () => ({ cookie: getRequestHeaders().get("cookie") ?? "" }),
      })
    )
  )
  .client((): AppRouterClient =>
    createORPCClient(new RPCLink({ url: `${window.location.origin}/rpc` }))
  );

const client = createClient();

export const api = createTanstackQueryUtils(client);
