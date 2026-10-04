import { parseResponse } from "hono/client";
import { describe, expect, it } from "vite-plus/test";

import { api, client } from "../support/api.ts";

const createTodo = async (title: string) => {
  const response = await client.todos.$post({ json: { title } });
  expect(response.status).toBe(201);
  return await parseResponse(response);
};

describe("todos", () => {
  it("creates a todo with a trimmed title, not yet completed", async () => {
    const todo = await createTodo("  Buy milk  ");

    expect(todo).toMatchObject({ completed: false, title: "Buy milk" });
    await expect(parseResponse(client.todos.$get())).resolves.toContainEqual(
      todo
    );
  });

  it.each(["", "   ", "x".repeat(201)])(
    "rejects the title %j with 400",
    async (title) => {
      await expect(
        client.todos.$post({ json: { title } })
      ).resolves.toHaveProperty("status", 400);
    }
  );

  it("completes a todo, then deletes it once", async () => {
    const todo = await createTodo("Buy milk");
    const param = { id: String(todo.id) };

    await expect(
      parseResponse(
        client.todos[":id"].$patch({ json: { completed: true }, param })
      )
    ).resolves.toStrictEqual({ ...todo, completed: true });
    await expect(
      client.todos[":id"].$delete({ param })
    ).resolves.toHaveProperty("status", 200);
    await expect(
      client.todos[":id"].$delete({ param })
    ).resolves.toHaveProperty("status", 404);
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
