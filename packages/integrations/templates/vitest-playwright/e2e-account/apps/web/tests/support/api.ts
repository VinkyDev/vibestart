import { e2eBaseURL } from "./server.ts";

export const password = "correct-horse-battery";

export const uniqueEmail = () => `${crypto.randomUUID()}@example.com`;

/** Signs up through the running server, as the sign-up form does. */
export const signUp = async (email = uniqueEmail()) => {
  const response = await fetch(`${e2eBaseURL}/api/auth/sign-up/email`, {
    body: JSON.stringify({ email, name: "Test User", password }),
    headers: { "content-type": "application/json", origin: e2eBaseURL },
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Sign up failed with ${response.status}`);
  }
  return { email };
};
