import { Effect, Layer } from "effect";
import { FetchHttpClient } from "effect/http";
import { RpcClient, RpcSerialization } from "effect/rpc";

import { TodosRpcs } from "@my-app/contracts";

import { e2eBaseURL } from "./server.ts";

export const password = "correct-horse-battery";

export const uniqueEmail = () => `${crypto.randomUUID()}@example.com`;

/** Creates a todo through the running server's `/rpc`, as the cookie's user. */
export const createTodo = async (cookie: string, title: string) => {
  const program = Effect.gen(function* () {
    const client = yield* RpcClient.make(TodosRpcs, { flatten: true });

    return yield* client("todos.create", { title });
  }).pipe(
    Effect.scoped,
    Effect.provide(
      RpcClient.layerProtocolHttp({ url: `${e2eBaseURL}/rpc` }).pipe(
        Layer.provide([RpcSerialization.layerNdjson, FetchHttpClient.layer]),
        Layer.provide(
          Layer.succeed(FetchHttpClient.Fetch, async (input, init) => {
            const request = new Request(input, init);
            request.headers.set("cookie", cookie);

            return await fetch(request);
          })
        )
      )
    )
  );

  return await Effect.runPromise(program);
};

/** Signs up through the running server, as the sign-up form does, and returns the new user's session cookie. */
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

  return { cookie, email };
};
