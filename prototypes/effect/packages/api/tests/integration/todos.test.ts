import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";

import { TodoNotFound, Unauthorized } from "@my-app/contracts";

import { createRaw, makeClient, TestApp } from "../support/app.ts";

type Client = Effect.Success<ReturnType<typeof makeClient>>;

layer(TestApp.layer, { timeout: "60 seconds" })("todos", (it) => {
  const anonymousCalls: readonly (readonly [
    string,
    (client: Client) => Effect.Effect<unknown, unknown>,
  ])[] = [
    ["list", (client) => client("todos.list", undefined)],
    ["create", (client) => client("todos.create", { title: "Buy milk" })],
    ["update", (client) => client("todos.update", { completed: true, id: 1 })],
    ["delete", (client) => client("todos.delete", { id: 1 })],
  ];

  for (const [name, call] of anonymousCalls) {
    it.effect(`rejects an anonymous ${name} as Unauthorized`, () =>
      Effect.gen(function* () {
        const client = yield* makeClient();

        const error = yield* Effect.flip(call(client));

        assert.instanceOf(error, Unauthorized);
      })
    );
  }

  it.effect("creates a todo with a trimmed title, not yet completed", () =>
    Effect.gen(function* () {
      const app = yield* TestApp;
      const cookie = yield* app.signUp;
      const client = yield* makeClient(cookie);

      const exit = yield* createRaw(cookie, "  Buy milk  ");

      assert.deepStrictEqual(exit, {
        _tag: "Success",
        value: { completed: false, title: "Buy milk" },
      });
      const [todo] = yield* client("todos.list", undefined);
      assert.deepInclude(todo, { completed: false, title: "Buy milk" });
    })
  );

  for (const title of ["", "   ", "x".repeat(201)]) {
    it.effect(`rejects the title ${JSON.stringify(title)}`, () =>
      Effect.gen(function* () {
        const app = yield* TestApp;
        const cookie = yield* app.signUp;
        const client = yield* makeClient(cookie);

        const exit = yield* createRaw(cookie, title);

        assert.deepStrictEqual(exit, { _tag: "Failure" });
        assert.deepStrictEqual(yield* client("todos.list", undefined), []);
      })
    );
  }

  it.effect("completes a todo, then deletes it once", () =>
    Effect.gen(function* () {
      const app = yield* TestApp;
      const client = yield* makeClient(yield* app.signUp);
      const todo = yield* client("todos.create", { title: "Buy milk" });

      assert.deepStrictEqual(
        yield* client("todos.update", { completed: true, id: todo.id }),
        { ...todo, completed: true }
      );
      yield* client("todos.delete", { id: todo.id });
      assert.deepStrictEqual(yield* client("todos.list", undefined), []);
      assert.deepStrictEqual(
        yield* Effect.flip(client("todos.delete", { id: todo.id })),
        new TodoNotFound({ id: todo.id })
      );
    })
  );

  it.effect("keeps each user's todos private", () =>
    Effect.gen(function* () {
      const app = yield* TestApp;
      const alice = yield* makeClient(yield* app.signUp);
      const bob = yield* makeClient(yield* app.signUp);
      const todo = yield* alice("todos.create", { title: "Alice's secret" });

      assert.deepStrictEqual(yield* bob("todos.list", undefined), []);
      assert.deepStrictEqual(
        yield* Effect.flip(
          bob("todos.update", { completed: true, id: todo.id })
        ),
        new TodoNotFound({ id: todo.id })
      );
      assert.deepStrictEqual(
        yield* Effect.flip(bob("todos.delete", { id: todo.id })),
        new TodoNotFound({ id: todo.id })
      );
      assert.deepStrictEqual(yield* alice("todos.list", undefined), [todo]);
    })
  );
});
