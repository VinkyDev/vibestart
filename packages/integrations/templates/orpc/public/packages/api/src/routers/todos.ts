import { todos } from "@my-app/db/schema/todos";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure } from "#src/procedures.ts";

const todoId = z.object({ id: z.int().positive() });

const firstOrNotFound = <T>([row]: T[]) => {
  if (row === undefined) {
    throw new ORPCError("NOT_FOUND", { message: "Todo not found" });
  }
  return row;
};

export const todosRouter = {
  create: publicProcedure
    .input(z.object({ title: z.string().trim().min(1).max(200) }))
    .handler(async ({ context, input }) =>
      firstOrNotFound(await context.db.insert(todos).values(input).returning())
    ),

  delete: publicProcedure
    .input(todoId)
    .handler(async ({ context, input }) =>
      firstOrNotFound(
        await context.db.delete(todos).where(eq(todos.id, input.id)).returning()
      )
    ),

  list: publicProcedure.handler(({ context }) =>
    context.db.query.todos.findMany({ orderBy: { id: "asc" } })
  ),

  update: publicProcedure
    .input(todoId.extend({ completed: z.boolean() }))
    .handler(async ({ context, input: { id, ...values } }) =>
      firstOrNotFound(
        await context.db
          .update(todos)
          .set(values)
          .where(eq(todos.id, id))
          .returning()
      )
    ),
};
