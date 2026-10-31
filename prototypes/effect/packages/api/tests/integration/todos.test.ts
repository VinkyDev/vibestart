import { assert, layer } from "@effect/vitest";
import { sql } from "drizzle-orm";
import { Effect } from "effect";

import {
  ServiceUnavailable,
  TodoNotFound,
  Unauthorized,
} from "@my-app/contracts";

import { createRaw, makeClient, rpcRaw, TestApp } from "../support/app.ts";

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

  for (const [origin, contentType] of [
    ["http://localhost:4000", "text/plain"],
    ["http://localhost:4000", "application/ndjson"],
    ["https://attacker.example", "text/plain"],
    ["null", "text/plain"],
    ["", "text/plain"],
  ] as const) {
    it.effect(
      `rejects ${contentType} RPC writes from the HTTP origin ${JSON.stringify(origin)}`,
      () =>
        Effect.gen(function* () {
          const app = yield* TestApp;
          const cookie = yield* app.signUp;
          const client = yield* makeClient(cookie);

          const response = yield* Effect.promise(
            async () =>
              await app.fetch(
                new Request("http://localhost/rpc", {
                  method: "POST",
                  headers: { "content-type": contentType, cookie, origin },
                  body: `${JSON.stringify({
                    _tag: "Request",
                    id: "1",
                    headers: [["origin", "http://localhost"]],
                    tag: "todos.create",
                    payload: { title: "Unwanted todo" },
                  })}\n`,
                })
              )
          );

          yield* Effect.promise(async () => await response.text());

          assert.deepStrictEqual(yield* client("todos.list", undefined), []);
          assert.strictEqual(response.status, 403);
        })
    );
  }

  it.effect(
    "accepts the configured public origin through an internal proxy URL",
    () =>
      Effect.gen(function* () {
        const app = yield* TestApp;
        const cookie = yield* app.signUp;
        const client = yield* makeClient(cookie);

        const response = yield* Effect.promise(
          async () =>
            await app.fetch(
              new Request("http://internal.example:3000/rpc", {
                method: "POST",
                headers: {
                  "content-type": "application/ndjson",
                  cookie,
                  origin: "http://localhost",
                },
                body: `${JSON.stringify({
                  _tag: "Request",
                  id: "1",
                  headers: [["origin", "https://attacker.example"]],
                  tag: "todos.create",
                  payload: { title: "Same-origin todo" },
                })}\n`,
              })
            )
        );

        yield* Effect.promise(async () => await response.text());

        assert.strictEqual(response.status, 200);
        const [todo] = yield* client("todos.list", undefined);
        assert.deepInclude(todo, { title: "Same-origin todo" });
      })
  );

  for (const title of [
    "",
    "   ",
    "x".repeat(201),
    "😀".repeat(201),
    "nul\u0000byte",
  ]) {
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

  it.effect(
    "accepts 200 Unicode code points and trims Unicode whitespace",
    () =>
      Effect.gen(function* () {
        const app = yield* TestApp;
        const cookie = yield* app.signUp;
        const title = "😀".repeat(200);
        const exit = yield* createRaw(cookie, `\u00A0${title}\u3000`);
        assert.deepStrictEqual(exit, {
          _tag: "Success",
          value: { completed: false, title },
        });
      })
  );

  for (const id of [0, -1, 1.5, 2_147_483_648]) {
    it.effect(`rejects id ${id} before querying storage`, () =>
      Effect.gen(function* () {
        const app = yield* TestApp;
        const cookie = yield* app.signUp;
        const body = yield* rpcRaw(cookie, "todos.delete", { id });
        assert.include(body, '"_tag":"Failure"');
        assert.notInclude(body, "TodoNotFound");
        assert.notInclude(body, "ServiceUnavailable");
      })
    );
  }

  it.effect(
    "returns a typed storage failure without SQL or parameters on the wire",
    () =>
      Effect.gen(function* () {
        const app = yield* TestApp;
        const cookie = yield* app.signUp;
        const client = yield* makeClient(cookie);
        yield* Effect.acquireUseRelease(
          app.database.execute(
            sql`alter table todos rename to unavailable_todos`
          ),
          () =>
            Effect.gen(function* () {
              assert.instanceOf(
                yield* Effect.flip(client("todos.list", undefined)),
                ServiceUnavailable
              );

              const body = yield* rpcRaw(cookie, "todos.create", {
                title: "private-payload-marker",
              });

              assert.include(body, "ServiceUnavailable");
              assert.notInclude(body, "private-payload-marker");
              assert.notInclude(body, "insert into");
              assert.notInclude(body, "Drizzle");
              assert.notInclude(body, '"_tag":"Die"');
              assert.notInclude(body, '"query"');
            }),
          () =>
            app.database
              .execute(sql`alter table unavailable_todos rename to todos`)
              .pipe(Effect.orDie)
        );
      })
  );

  it.effect("sets browser security headers on public HTTP responses", () =>
    Effect.gen(function* () {
      const app = yield* TestApp;

      const response = yield* Effect.promise(
        async () => await app.fetch(new Request("http://localhost/api/health"))
      );

      assert.strictEqual(response.status, 200);
      assert.strictEqual(
        response.headers.get("x-content-type-options"),
        "nosniff"
      );
      assert.strictEqual(response.headers.get("x-frame-options"), "DENY");
    })
  );

  it.effect(
    "does not misreport an auth database outage as an anonymous session",
    () =>
      Effect.gen(function* () {
        const app = yield* TestApp;
        const cookie = yield* app.signUp;
        const client = yield* makeClient(cookie);
        yield* Effect.acquireUseRelease(
          app.database.execute(
            sql`alter table session rename to unavailable_session`
          ),
          () =>
            Effect.gen(function* () {
              assert.instanceOf(
                yield* Effect.flip(client("todos.list", undefined)),
                ServiceUnavailable
              );

              const body = yield* rpcRaw(cookie, "todos.create", {
                title: "Unsent",
              });

              assert.include(body, "ServiceUnavailable");
              assert.notInclude(body, "select");
              assert.notInclude(body, "unavailable_session");
            }),
          () =>
            app.database
              .execute(sql`alter table unavailable_session rename to session`)
              .pipe(Effect.orDie)
        );
      })
  );
});
