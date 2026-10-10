import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

import type { AppRouterClient } from "@my-app/api";

import { apiUrl } from "#src/env.ts";

const link = new RPCLink({ url: `${apiUrl}/rpc` });

const client: AppRouterClient = createORPCClient(link);

export const api = createTanstackQueryUtils(client);
