import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { AppRouterClient } from "@my-app/api";

const client: AppRouterClient = createORPCClient(
  new RPCLink({ url: () => `${window.location.origin}/rpc` })
);

export const api = createTanstackQueryUtils(client);
