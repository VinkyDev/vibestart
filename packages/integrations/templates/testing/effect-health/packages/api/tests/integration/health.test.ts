import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";

import { makeClient, TestApp } from "../support/app.ts";

layer(TestApp.layer)("health", (it) => {
  it.effect("serves a typed RPC without database or authentication", () => Effect.gen(function* () {
    const client = yield* makeClient;
    assert.deepStrictEqual(yield* client("health.check", undefined), { status: "ok" });
  }));

  it.effect("serves HTTP health and API documentation", () => Effect.gen(function* () {
    const app = yield* TestApp;

    for (const path of ["/api/health", "/api/openapi.json", "/api/docs"]) {
      const response = yield* Effect.promise(async () => await app.fetch(new Request(`http://localhost${path}`)));

      assert.strictEqual(response.status, 200);
      assert.strictEqual(response.headers.get("x-content-type-options"), "nosniff");
      yield* Effect.promise(async () => await response.text());
    }
  }));
});
