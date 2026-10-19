import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { createAuthClient } from "better-auth/react";

import { auth } from "#src/server/context.ts";

export const authClient = createAuthClient();

export const getSession = createServerFn({ method: "GET" }).handler(
  async () => await auth.api.getSession({ headers: getRequestHeaders() })
);
