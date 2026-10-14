import { toTodo } from "@my-app/db";
import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { publicProcedure } from "#src/procedures.ts";

// An ObjectId as the API spells it; anything else could never name a todo.
const todoId = z.object({ id: z.string().regex(/^[\da-f]{24}$/u) });

const notFound = () =>
  new ORPCError("NOT_FOUND", { message: "Todo not found" });

export const todosRouter = {
  create: publicProcedure
    .input(z.object({ title: z.string().trim().min(1).max(200) }))
    .handler(async ({ context, input }) => {
      const created = await context.db.todos.create(input);

      return toTodo(created.toObject());
    }),

  delete: publicProcedure.input(todoId).handler(async ({ context, input }) => {
    const row = await context.db.todos.findByIdAndDelete(input.id).lean();

    if (row === null) {
      throw notFound();
    }

    return toTodo(row);
  }),

  list: publicProcedure.handler(async ({ context }) => {
    const rows = await context.db.todos.find().sort({ _id: 1 }).lean();

    return rows.map(toTodo);
  }),

  update: publicProcedure
    .input(todoId.extend({ completed: z.boolean() }))
    .handler(async ({ context, input: { id, ...data } }) => {
      const row = await context.db.todos
        .findByIdAndUpdate(id, data, { returnDocument: "after" })
        .lean();

      if (row === null) {
        throw notFound();
      }

      return toTodo(row);
    }),
};
