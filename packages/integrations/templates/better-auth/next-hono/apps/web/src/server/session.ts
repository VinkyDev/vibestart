import "server-only";
import { createAuthClient } from "better-auth/client";
import { headers } from "next/headers";
import { cache } from "react";

import { readEnv } from "#src/server/env.ts";

// Pages render on the web server, which asks the API server for the visitor's session.
export const getSession = cache(async () => {
  const requestHeaders = await headers();
  const { data, error } = await createAuthClient({
    baseURL: readEnv().SERVER_URL,
  }).getSession({
    fetchOptions: {
      headers: { cookie: requestHeaders.get("cookie") ?? "" },
    },
  });
  if (error) {
    throw new Error(error.message ?? error.statusText);
  }
  return data;
});
