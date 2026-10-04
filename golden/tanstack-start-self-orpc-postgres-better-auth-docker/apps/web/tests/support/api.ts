import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

import type { AppRouterClient } from "@my-app/api";

import { e2eBaseURL } from "./server.ts";

export const password = "correct-horse-battery";

export const uniqueEmail = () => `${crypto.randomUUID()}@example.com`;

export const createTodo = async (client: AppRouterClient, title: string) =>
  await client.todos.create({ title });

/** Signs up through the running server, as the sign-up form does, and returns a client that calls as the new user. */
export const signUp = async (email = uniqueEmail()) => {
  const response = await fetch(`${e2eBaseURL}/api/auth/sign-up/email`, {
    body: JSON.stringify({ email, name: "Test User", password }),
    headers: { "content-type": "application/json", origin: e2eBaseURL },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Sign up failed with ${response.status}`);
  }
  const cookie = response.headers
    .getSetCookie()
    .map((header) => header.split(";")[0])
    .join("; ");
  const client: AppRouterClient = createORPCClient(
    new RPCLink({ headers: { cookie }, url: `${e2eBaseURL}/rpc` })
  );
  return { client, email };
};
