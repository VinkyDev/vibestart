import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { createAuthClient } from "better-auth/react";

import { getServices } from "#src/server/context.ts";

export const authClient = createAuthClient();

export const getSession = createServerFn({ method: "GET" }).handler(
  async () =>
    await getServices().auth.api.getSession({ headers: getRequestHeaders() })
);
