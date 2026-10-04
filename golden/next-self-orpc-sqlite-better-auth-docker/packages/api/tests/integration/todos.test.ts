import { describe, expect, it } from "vite-plus/test";

import { createClient, signUp } from "../support/api.ts";

const anonymous = createClient();

describe("todos", () => {
  it.each([
    ["list", async () => await anonymous.todos.list()],
    ["create", async () => await anonymous.todos.create({ title: "Buy milk" })],
    [
      "update",
      async () => await anonymous.todos.update({ completed: true, id: 1 }),
    ],
    ["delete", async () => await anonymous.todos.delete({ id: 1 })],
  ])("rejects an anonymous %s with UNAUTHORIZED", async (_, call) => {
    await expect(call()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("creates a todo with a trimmed title, not yet completed", async () => {
    const client = await signUp();

    const todo = await client.todos.create({ title: "  Buy milk  " });

    expect(todo).toMatchObject({ completed: false, title: "Buy milk" });
    await expect(client.todos.list()).resolves.toStrictEqual([todo]);
  });

  it.each(["", "   ", "x".repeat(201)])(
    "rejects the title %j with BAD_REQUEST",
    async (title) => {
      const client = await signUp();

      await expect(client.todos.create({ title })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    }
  );

  it("completes a todo, then deletes it once", async () => {
    const client = await signUp();
    const todo = await client.todos.create({ title: "Buy milk" });

    await expect(
      client.todos.update({ completed: true, id: todo.id })
    ).resolves.toStrictEqual({ ...todo, completed: true });
    await client.todos.delete({ id: todo.id });
    await expect(client.todos.list()).resolves.toStrictEqual([]);
    await expect(client.todos.delete({ id: todo.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("keeps each user's todos private", async () => {
    const [alice, bob] = await Promise.all([signUp(), signUp()]);
    const todo = await alice.todos.create({ title: "Alice's secret" });

    await expect(bob.todos.list()).resolves.toStrictEqual([]);
    await expect(
      bob.todos.update({ completed: true, id: todo.id })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(bob.todos.delete({ id: todo.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(alice.todos.list()).resolves.toStrictEqual([todo]);
  });
});
