import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";

import { TodoNotFound } from "@my-app/contracts";

import { makeClient, TestApp } from "../support/app.ts";

layer(TestApp.layer, { timeout: "60 seconds" })("public todos", (it) => {
  it.effect("creates, lists, updates, and deletes without authentication", () => Effect.gen(function* () {
    const client = yield* makeClient;

    const todo = yield* client("todos.create", { title: "Buy milk" });
    assert.strictEqual(todo.title, "Buy milk");
    assert.strictEqual(todo.completed, false);
    assert.deepStrictEqual(yield* client("todos.list", undefined), [todo]);
    assert.deepStrictEqual(yield* client("todos.update", { id: todo.id, completed: true }), { ...todo, completed: true });
    yield* client("todos.delete", { id: todo.id });
    assert.deepStrictEqual(yield* client("todos.list", undefined), []);
    assert.instanceOf(yield* Effect.flip(client("todos.delete", { id: todo.id })), TodoNotFound);
  }));

  it.effect("trims a title at the server boundary", () => Effect.gen(function* () {
    const app = yield* TestApp;
    const client = yield* makeClient;

    const response = yield* Effect.promise(async () => await app.fetch(new Request("http://localhost/rpc", {
      method: "POST",
      headers: { "content-type": "application/ndjson" },
      body: `${JSON.stringify({ _tag: "Request", id: "1", tag: "todos.create", payload: { title: "  Buy milk  " }, headers: [] })}\n`,
    })));

    const body = yield* Effect.promise(async () => await response.text());
    assert.strictEqual(response.status, 200);
    assert.include(body, '"_tag":"Success"');

    const todos = yield* client("todos.list", undefined);
    assert.deepStrictEqual(todos.map(({ title }) => title), ["Buy milk"]);

    for (const todo of todos) {
      yield* client("todos.delete", { id: todo.id });
    }
  }));

  for (const title of ["", "   ", "x".repeat(201), "😀".repeat(201), "nul\u0000byte"]) {
    it.effect(`rejects an invalid title on the wire: ${JSON.stringify(title)}`, () => Effect.gen(function* () {
      const app = yield* TestApp;

      const response = yield* Effect.promise(async () => await app.fetch(new Request("http://localhost/rpc", {
        method: "POST",
        headers: { "content-type": "application/ndjson" },
        body: `${JSON.stringify({ _tag: "Request", id: "1", tag: "todos.create", payload: { title }, headers: [] })}\n`,
      })));

      const body = yield* Effect.promise(async () => await response.text());
      assert.include(body, '"_tag":"Failure"');
      assert.notInclude(body, "ServiceUnavailable");
    }));
  }

  for (const origin of ["", "null", "http://localhost:4000", "https://attacker.example"]) {
    it.effect(`rejects an untrusted browser origin without auth: ${origin}`, () => Effect.gen(function* () {
      const app = yield* TestApp;

      const response = yield* Effect.promise(async () => await app.fetch(new Request("http://localhost/rpc", {
        method: "POST",
        headers: { "content-type": "text/plain", origin },
        body: `${JSON.stringify({ _tag: "Request", id: "1", tag: "todos.create", payload: { title: "Unwanted" }, headers: [["origin", "http://localhost"]] })}\n`,
      })));

      yield* Effect.promise(async () => await response.text());
      assert.strictEqual(response.status, 403);

      const client = yield* makeClient;
      assert.deepStrictEqual(yield* client("todos.list", undefined), []);
    }));
  }
});
