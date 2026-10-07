import { parseResponse } from "hono/client";
import { describe, expect, it } from "vite-plus/test";

import { api, createClient, signUp } from "../support/api.ts";

type Client = ReturnType<typeof createClient>;

const anonymous = createClient();
const param = { id: "1" };

const createTodo = async (client: Client, title: string) => {
  const response = await client.todos.$post({ json: { title } });
  expect(response.status).toBe(201);
  return await parseResponse(response);
};

describe("todos", () => {
  it.each([
    ["GET /todos", async () => await anonymous.todos.$get()],
    [
      "POST /todos",
      async () => await anonymous.todos.$post({ json: { title: "Buy milk" } }),
    ],
    [
      "PATCH /todos/:id",
      async () =>
        await anonymous.todos[":id"].$patch({ json: { completed: true }, param }),
    ],
    [
      "DELETE /todos/:id",
      async () => await anonymous.todos[":id"].$delete({ param }),
    ],
  ])("rejects an anonymous %s with 401", async (_, call) => {
    await expect(call()).resolves.toHaveProperty("status", 401);
  });

  it("creates a todo with a trimmed title, not yet completed", async () => {
    const client = await signUp();

    const todo = await createTodo(client, "  Buy milk  ");

    expect(todo).toMatchObject({ completed: false, title: "Buy milk" });
    await expect(parseResponse(client.todos.$get())).resolves.toStrictEqual([
      todo,
    ]);
  });

  it.each(["", "   ", "x".repeat(201)])(
    "rejects the title %j with 400",
    async (title) => {
      const client = await signUp();

      await expect(
        client.todos.$post({ json: { title } })
      ).resolves.toHaveProperty("status", 400);
    }
  );

  it("completes a todo, then deletes it once", async () => {
    const client = await signUp();
    const todo = await createTodo(client, "Buy milk");
    const own = { id: String(todo.id) };

    await expect(
      parseResponse(
        client.todos[":id"].$patch({ json: { completed: true }, param: own })
      )
    ).resolves.toStrictEqual({ ...todo, completed: true });
    await expect(
      client.todos[":id"].$delete({ param: own })
    ).resolves.toHaveProperty("status", 200);
    await expect(
      client.todos[":id"].$delete({ param: own })
    ).resolves.toHaveProperty("status", 404);
  });

  it("keeps each user's todos private", async () => {
    const [alice, bob] = await Promise.all([signUp(), signUp()]);
    const todo = await createTodo(alice, "Alice's secret");
    const own = { id: String(todo.id) };

    await expect(parseResponse(bob.todos.$get())).resolves.toStrictEqual([]);
    await expect(
      bob.todos[":id"].$patch({ json: { completed: true }, param: own })
    ).resolves.toHaveProperty("status", 404);
    await expect(
      bob.todos[":id"].$delete({ param: own })
    ).resolves.toHaveProperty("status", 404);
    await expect(parseResponse(alice.todos.$get())).resolves.toStrictEqual([
      todo,
    ]);
  });

  it("describes every route in the OpenAPI document", async () => {
    const response = await api.request("/openapi.json");

    await expect(response.json()).resolves.toMatchObject({
      paths: {
        "/health": { get: {} },
        "/todos": { get: {}, post: {} },
        "/todos/{id}": { delete: {}, patch: {} },
      },
      servers: [{ url: "/api" }],
    });
  });
});
