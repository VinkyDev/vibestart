import type { Context } from "@vibestart/core";
import { file } from "@vibestart/core";

export const publicTestApp = (ctx: Context) =>
  file(
    "packages/api/tests/support/app.ts",
    `
import { ConfigProvider, Context, Effect, Layer } from "effect";
import { FetchHttpClient, HttpRouter, HttpServer } from "effect/http";
import { RpcClient, RpcSerialization } from "effect/rpc";

import { ${ctx.stack.database === undefined ? "HealthRpcs" : "TodosRpcs"} } from "${ctx.scope}/contracts";
${
  ctx.stack.database === undefined
    ? ""
    : `import { Database } from "${ctx.scope}/db";
import { makeTestDatabase } from "${ctx.scope}/db/testing";`
}

import { Routes } from "#src/index.ts";

export class TestApp extends Context.Service<TestApp, {
  readonly fetch: (request: Request) => Promise<Response>;
}>()("${ctx.scope}/api/tests/TestApp") {
  static readonly layer = Layer.effect(TestApp, Effect.gen(function* () {
    ${ctx.stack.database === undefined ? "" : "const url = yield* makeTestDatabase;"}

    const { handler, dispose } = HttpRouter.toWebHandler(Routes.pipe(
      ${ctx.stack.database === undefined ? "" : "Layer.provide(Database.layerUrl(url)),"}
      Layer.provide(HttpServer.layerServices),
      Layer.provide(Layer.succeed(ConfigProvider.ConfigProvider, ConfigProvider.fromUnknown({ APP_URL: "http://localhost" })))
    ), { disableLogger: true });

    yield* Effect.addFinalizer(() => Effect.promise(dispose));

    return { fetch: handler };
  }));
}

export const makeClient = Effect.gen(function* () {
  const app = yield* TestApp;

  return yield* RpcClient.make(${ctx.stack.database === undefined ? "HealthRpcs" : "TodosRpcs"}, { flatten: true }).pipe(
    Effect.provide(RpcClient.layerProtocolHttp({ url: "http://localhost/rpc" }).pipe(
      Layer.provide([RpcSerialization.layerNdjson, FetchHttpClient.layer]),
      Layer.provide(Layer.succeed(FetchHttpClient.Fetch, async (input, init) => await app.fetch(new Request(input, init))))
    ))
  );
});
`
  );
