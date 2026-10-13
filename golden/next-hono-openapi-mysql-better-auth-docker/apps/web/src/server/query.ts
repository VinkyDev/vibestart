import "server-only";
import { QueryClient } from "@tanstack/react-query";
import { hc } from "hono/client";
import { headers } from "next/headers";
import { cache } from "react";

import type { Api } from "@my-app/api";

import { createQueries } from "#src/lib/api.ts";
import { readEnv } from "#src/server/env.ts";

// `next build` imports this module without runtime variables, so each request resolves `SERVER_URL`.
const fetchFromServer: typeof fetch = async (input, init) =>
  await fetch(
    new URL(input instanceof Request ? input.url : input, readEnv().SERVER_URL),
    init
  );

// Server Components call the API server directly, with the visitor's cookies.
export const serverApi = createQueries(
  hc<Api>("/api", {
    fetch: fetchFromServer,
    headers: async () => {
      const requestHeaders = await headers();
      return { cookie: requestHeaders.get("cookie") ?? "" };
    },
  })
);

export const getQueryClient = cache(() => new QueryClient());
