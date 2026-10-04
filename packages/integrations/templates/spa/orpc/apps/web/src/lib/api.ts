import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { AppRouterClient } from "@my-app/api";

const link = new RPCLink({ url: `${window.location.origin}/rpc` });

const client: AppRouterClient = createORPCClient(link);

export const api = createTanstackQueryUtils(client);
