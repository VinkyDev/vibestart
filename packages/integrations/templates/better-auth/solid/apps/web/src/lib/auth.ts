import { query } from "@solidjs/router";
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient();

export const getSession = query(async () => {
  const { data, error } = await authClient.getSession();

  if (error) {
    throw new Error(error.message ?? error.statusText);
  }

  return data;
}, "session");
