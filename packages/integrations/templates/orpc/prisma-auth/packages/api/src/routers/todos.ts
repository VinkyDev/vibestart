import type { Database } from "@my-app/db";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { protectedProcedure } from "#src/procedures.ts";

const todoId = z.object({ id: z.int().positive() });

// A write finds the user's row first: someone else's todo is not found either.
const findOrNotFound = async (db: Database, id: number, userId: string) => {
  const row = await db.todo.findFirst({ where: { id, userId } });

  if (row === null) {
    throw new ORPCError("NOT_FOUND", { message: "Todo not found" });
  }

  return row;
};

export const todosRouter = {
  create: protectedProcedure
    .input(z.object({ title: z.string().trim().min(1).max(200) }))
    .handler(
      async ({ context, input }) =>
        await context.db.todo.create({
          data: { ...input, userId: context.session.user.id },
        })
    ),

  delete: protectedProcedure.input(todoId).handler(async ({ context, input }) => {
    const todo = await findOrNotFound(
      context.db,
      input.id,
      context.session.user.id
    );

    await context.db.todo.delete({ where: { id: todo.id } });

    return todo;
  }),

  list: protectedProcedure.handler(
    async ({ context }) =>
      await context.db.todo.findMany({
        orderBy: { id: "asc" },
        where: { userId: context.session.user.id },
      })
  ),

  update: protectedProcedure
    .input(todoId.extend({ completed: z.boolean() }))
    .handler(async ({ context, input: { id, ...data } }) => {
      const todo = await findOrNotFound(
        context.db,
        id,
        context.session.user.id
      );

      return await context.db.todo.update({ data, where: { id: todo.id } });
    }),
};
