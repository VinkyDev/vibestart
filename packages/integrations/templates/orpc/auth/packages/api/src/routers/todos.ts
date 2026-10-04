import { todos } from "@my-app/db/schema/todos";
import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "#src/procedures.ts";

const todoId = z.object({ id: z.int().positive() });

const firstOrNotFound = <T>([row]: T[]) => {
  if (row === undefined) {
    throw new ORPCError("NOT_FOUND", { message: "Todo not found" });
  }
  return row;
};

export const todosRouter = {
  create: protectedProcedure
    .input(z.object({ title: z.string().trim().min(1).max(200) }))
    .handler(async ({ context, input }) =>
      firstOrNotFound(
        await context.db
          .insert(todos)
          .values({ ...input, userId: context.session.user.id })
          .returning()
      )
    ),

  delete: protectedProcedure.input(todoId).handler(async ({ context, input }) =>
    firstOrNotFound(
      await context.db
        .delete(todos)
        .where(
          and(eq(todos.id, input.id), eq(todos.userId, context.session.user.id))
        )
        .returning()
    )
  ),

  list: protectedProcedure.handler(({ context }) =>
    context.db.query.todos.findMany({
      orderBy: { id: "asc" },
      where: { userId: context.session.user.id },
    })
  ),

  update: protectedProcedure
    .input(todoId.extend({ completed: z.boolean() }))
    .handler(async ({ context, input: { id, ...values } }) =>
      firstOrNotFound(
        await context.db
          .update(todos)
          .set(values)
          .where(
            and(eq(todos.id, id), eq(todos.userId, context.session.user.id))
          )
          .returning()
      )
    ),
};
