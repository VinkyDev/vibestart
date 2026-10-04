import "server-only";
import { appRouter } from "@my-app/api";
import type { AppRouterClient } from "@my-app/api";
import { createRouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClient } from "@tanstack/react-query";
import { headers } from "next/headers";
import { cache } from "react";

import { createContext } from "#src/server/orpc.ts";

const serverClient: AppRouterClient = createRouterClient(appRouter, {
  context: async () => await createContext(await headers()),
});

export const serverApi = createTanstackQueryUtils(serverClient);

export const getQueryClient = cache(() => new QueryClient());
