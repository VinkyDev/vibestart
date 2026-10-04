import { hc, parseResponse } from "hono/client";

import type { Api } from "@my-app/api";

import { e2eBaseURL } from "./server.ts";

type Client = ReturnType<typeof hc<Api>>;

export const password = "correct-horse-battery";

export const uniqueEmail = () => `${crypto.randomUUID()}@example.com`;

export const createTodo = async (client: Client, title: string) =>
  await parseResponse(client.todos.$post({ json: { title } }));

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
  return { client: hc<Api>(`${e2eBaseURL}/api`, { headers: { cookie } }), email };
};
