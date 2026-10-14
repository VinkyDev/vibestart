import type { Database } from "@my-app/db";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { publicProcedure } from "#src/procedures.ts";

const todoId = z.object({ id: z.int().positive() });

const findOrNotFound = async (db: Database, id: number) => {
  const row = await db.todo.findUnique({ where: { id } });

  if (row === null) {
    throw new ORPCError("NOT_FOUND", { message: "Todo not found" });
  }

  return row;
};

export const todosRouter = {
  create: publicProcedure
    .input(z.object({ title: z.string().trim().min(1).max(200) }))
    .handler(
      async ({ context, input }) => await context.db.todo.create({ data: input })
    ),

  delete: publicProcedure.input(todoId).handler(async ({ context, input }) => {
    const todo = await findOrNotFound(context.db, input.id);
    await context.db.todo.delete({ where: { id: todo.id } });

    return todo;
  }),

  list: publicProcedure.handler(
    async ({ context }) =>
      await context.db.todo.findMany({ orderBy: { id: "asc" } })
  ),

  update: publicProcedure
    .input(todoId.extend({ completed: z.boolean() }))
    .handler(async ({ context, input: { id, ...data } }) => {
      const todo = await findOrNotFound(context.db, id);

      return await context.db.todo.update({ data, where: { id: todo.id } });
    }),
};
