import type { Api } from "@my-app/api";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { hc } from "hono/client";

import { env } from "#src/server/env.ts";

// During SSR the web server calls the API server directly, with the visitor's cookies.
export const createClient = createIsomorphicFn()
  .server(() =>
    hc<Api>(`${env.SERVER_URL}/api`, {
      headers: () => ({ cookie: getRequestHeaders().get("cookie") ?? "" }),
    })
  )
  .client(() => hc<Api>("/api"));
