import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

import type { AppRouterClient } from "@my-app/api";

const link = new RPCLink({ url: new URL("/rpc", window.location.origin) });

export const api: AppRouterClient = createORPCClient(link);
