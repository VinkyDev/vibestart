import { ORPCError } from "@orpc/server";
import { z } from "zod";

import { toTodo } from "@my-app/db";

import { protectedProcedure } from "#src/procedures.ts";

// An ObjectId as the API spells it; anything else could never name a todo.
const todoId = z.object({ id: z.string().regex(/^[\da-f]{24}$/u) });

const notFound = () =>
  new ORPCError("NOT_FOUND", { message: "Todo not found" });

export const todosRouter = {
  create: protectedProcedure
    .input(z.object({ title: z.string().trim().min(1).max(200) }))
    .handler(async ({ context, input }) => {
      const created = await context.db.todos.create({
        ...input,
        userId: context.session.user.id,
      });

      return toTodo(created.toObject());
    }),

  // Each write matches the user's id too: someone else's todo is not found either.
  delete: protectedProcedure
    .input(todoId)
    .handler(async ({ context, input }) => {
      const row = await context.db.todos
        .findOneAndDelete({ _id: input.id, userId: context.session.user.id })
        .lean();

      if (row === null) {
        throw notFound();
      }

      return toTodo(row);
    }),

  list: protectedProcedure.handler(async ({ context }) => {
    const rows = await context.db.todos
      .find({ userId: context.session.user.id })
      .sort({ _id: 1 })
      .lean();

    return rows.map(toTodo);
  }),

  update: protectedProcedure
    .input(todoId.extend({ completed: z.boolean() }))
    .handler(async ({ context, input: { id, ...data } }) => {
      const row = await context.db.todos
        .findOneAndUpdate({ _id: id, userId: context.session.user.id }, data, {
          returnDocument: "after",
        })
        .lean();

      if (row === null) {
        throw notFound();
      }

      return toTodo(row);
    }),
};
