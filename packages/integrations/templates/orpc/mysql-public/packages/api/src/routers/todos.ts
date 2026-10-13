import type { Database } from "@my-app/db";
import { todos } from "@my-app/db/schema/todos";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { publicProcedure } from "#src/procedures.ts";

const todoId = z.object({ id: z.int().positive() });

// MySQL has no `returning`, so a write finds its row by id.
const findOrNotFound = async (db: Database, id: number) => {
  const row = await db.query.todos.findFirst({ where: { id } });
  if (row === undefined) {
    throw new ORPCError("NOT_FOUND", { message: "Todo not found" });
  }
  return row;
};

export const todosRouter = {
  create: publicProcedure
    .input(z.object({ title: z.string().trim().min(1).max(200) }))
    .handler(async ({ context, input }) => {
      const [created] = await context.db
        .insert(todos)
        .values(input)
        .$returningId();
      if (created === undefined) {
        throw new Error("The insert returned no id");
      }
      return findOrNotFound(context.db, created.id);
    }),

  delete: publicProcedure.input(todoId).handler(async ({ context, input }) => {
    const todo = await findOrNotFound(context.db, input.id);
    await context.db.delete(todos).where(eq(todos.id, todo.id));
    return todo;
  }),

  list: publicProcedure.handler(({ context }) =>
    context.db.query.todos.findMany({ orderBy: { id: "asc" } })
  ),

  update: publicProcedure
    .input(todoId.extend({ completed: z.boolean() }))
    .handler(async ({ context, input: { id, ...values } }) => {
      const todo = await findOrNotFound(context.db, id);
      await context.db.update(todos).set(values).where(eq(todos.id, todo.id));
      return { ...todo, ...values };
    }),
};
