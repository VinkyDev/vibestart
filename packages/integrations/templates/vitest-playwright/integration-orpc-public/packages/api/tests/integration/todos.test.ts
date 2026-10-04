import { describe, expect, it } from "vite-plus/test";

import { client } from "../support/api.ts";

describe("todos", () => {
  it("creates a todo with a trimmed title, not yet completed", async () => {
    const todo = await client.todos.create({ title: "  Buy milk  " });

    expect(todo).toMatchObject({ completed: false, title: "Buy milk" });
    await expect(client.todos.list()).resolves.toContainEqual(todo);
  });

  it.each(["", "   ", "x".repeat(201)])(
    "rejects the title %j with BAD_REQUEST",
    async (title) => {
      await expect(client.todos.create({ title })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    }
  );

  it("completes a todo, then deletes it once", async () => {
    const todo = await client.todos.create({ title: "Buy milk" });

    await expect(
      client.todos.update({ completed: true, id: todo.id })
    ).resolves.toStrictEqual({ ...todo, completed: true });
    await client.todos.delete({ id: todo.id });
    await expect(client.todos.list()).resolves.not.toContainEqual(
      expect.objectContaining({ id: todo.id })
    );
    await expect(client.todos.delete({ id: todo.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
