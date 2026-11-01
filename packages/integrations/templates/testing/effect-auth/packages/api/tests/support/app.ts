import { Context, Effect, Layer, Redacted, Schema } from "effect";
import { FetchHttpClient, HttpRouter, HttpServer } from "effect/http";
import { RpcClient, RpcSerialization } from "effect/rpc";

import { Auth } from "@my-app/auth";
import { TodosRpcs } from "@my-app/contracts";
import { Database } from "@my-app/db";
import { makeTestDatabase } from "@my-app/db/testing";

import { Routes } from "#src/index.ts";

const origin = "http://localhost";

/**
 * The server's routes as a Fetch handler in this process, on a migrated database of its own, so
 * each test file runs in parallel without a port or shared rows.
 */
export class TestApp extends Context.Service<
  TestApp,
  {
    readonly database: typeof Database.Service;
    readonly fetch: (request: Request) => Promise<Response>;
    readonly signUp: Effect.Effect<string>;
  }
>()("@my-app/api/tests/TestApp") {
  static readonly layer = Layer.effect(
    TestApp,
    Effect.gen(function* () {
      const url = yield* makeTestDatabase;

      const services = yield* Layer.build(
        Layer.mergeAll(
          Database.layerUrl(url),
          Auth.layer({
            baseURL: origin,
            databaseUrl: url,
            secret: Redacted.make("test-secret-that-is-at-least-32-characters"),
          })
        )
      );

      const { dispose, handler } = HttpRouter.toWebHandler(
        Routes.pipe(
          Layer.provide(Layer.succeedContext(services)),
          Layer.provide(HttpServer.layerServices)
        ),
        { disableLogger: true }
      );

      yield* Effect.addFinalizer(() => Effect.promise(dispose));

      const signUp = Effect.promise(async () => {
        const response = await handler(
          new Request(`${origin}/api/auth/sign-up/email`, {
            method: "POST",
            headers: { "content-type": "application/json", origin },
            body: JSON.stringify({
              email: `${crypto.randomUUID()}@example.com`,
              name: "Test User",
              password: "correct-horse-battery",
            }),
          })
        );

        if (!response.ok) {
          throw new Error(`Sign up failed with ${response.status}`);
        }

        const { headers } = response;

        return headers
          .getSetCookie()
          .map((header) => header.split(";")[0])
          .join("; ");
      });

      return {
        database: Context.get(services, Database),
        fetch: handler,
        signUp,
      };
    })
  );
}

export const makeClient = Effect.fnUntraced(function* (cookie?: string) {
  const app = yield* TestApp;

  const fetch = async (
    ...[input, init]: Parameters<typeof globalThis.fetch>
  ) => {
    const request = new Request(input, init);

    if (cookie !== undefined) {
      request.headers.set("cookie", cookie);
    }

    return await app.fetch(request);
  };

  return yield* RpcClient.make(TodosRpcs, { flatten: true }).pipe(
    Effect.provide(
      RpcClient.layerProtocolHttp({ url: `${origin}/rpc` }).pipe(
        Layer.provide([RpcSerialization.layerNdjson, FetchHttpClient.layer]),
        Layer.provide(Layer.succeed(FetchHttpClient.Fetch, fetch))
      )
    )
  );
});

const CreateExit = Schema.fromJsonString(
  Schema.Struct({
    exit: Schema.Union([
      Schema.Struct({
        _tag: Schema.Literal("Success"),
        value: Schema.Struct({
          completed: Schema.Boolean,
          title: Schema.String,
        }),
      }),
      Schema.Struct({ _tag: Schema.Literal("Failure") }),
    ]),
  })
);

/**
 * Posts raw NDJSON past client validation, so tests observe the server's actual wire response.
 */
export const rpcRaw = Effect.fnUntraced(function* (
  cookie: string,
  tag: string,
  payload: Record<string, string | number | boolean>
) {
  const app = yield* TestApp;

  const response = yield* Effect.promise(
    async () =>
      await app.fetch(
        new Request(`${origin}/rpc`, {
          body: `${JSON.stringify({ _tag: "Request", headers: [], id: "1", payload, tag })}\n`,
          headers: { "content-type": "application/ndjson", cookie },
          method: "POST",
        })
      )
  );

  return yield* Effect.promise(async () => await response.text());
});

export const createRaw = Effect.fnUntraced(function* (
  cookie: string,
  title: string
) {
  const body = yield* rpcRaw(cookie, "todos.create", { title });
  const { exit } = yield* Schema.decodeUnknownEffect(CreateExit)(body.trim());

  return exit;
});
