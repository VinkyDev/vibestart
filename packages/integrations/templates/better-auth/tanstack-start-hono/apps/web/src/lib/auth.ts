import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { createAuthClient } from "better-auth/react";

import { env } from "#src/server/env.ts";

export const authClient = createAuthClient();

// Pages render on the web server, which asks the API server for the visitor's session.
export const getSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await createAuthClient({
      baseURL: env.SERVER_URL,
    }).getSession({
      fetchOptions: {
        headers: { cookie: getRequestHeaders().get("cookie") ?? "" },
      },
    });
    if (error) {
      throw new Error(error.message ?? error.statusText);
    }
    return data;
  }
);
