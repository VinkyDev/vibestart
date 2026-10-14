import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

import { toTodo } from "@my-app/db";

import type { Services } from "#src/services.ts";

const json = <T extends z.ZodType>(schema: T) => ({
  "application/json": { schema },
});

const todo = z
  .object({
    completed: z.boolean(),
    createdAt: z.iso.datetime(),
    id: z.string(),
    title: z.string(),
  })
  .openapi("Todo");

// An ObjectId as the API spells it; anything else could never name a todo.
const params = z.object({
  id: z
    .string()
    .regex(/^[\da-f]{24}$/u)
    .openapi({ param: { in: "path", name: "id" } }),
});

const invalid = { description: "The request does not match its schema" };

const notFound = {
  content: json(z.object({ message: z.string() })),
  description: "No todo has this id",
};

const listTodos = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: json(z.array(todo)),
      description: "Every todo, oldest first",
    },
  },
});

const createTodo = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: json(z.object({ title: z.string().trim().min(1).max(200) })),
      required: true,
    },
  },
  responses: {
    201: { content: json(todo), description: "The created todo" },
    400: invalid,
  },
});

const updateTodo = createRoute({
  method: "patch",
  path: "/{id}",
  request: {
    body: {
      content: json(z.object({ completed: z.boolean() })),
      required: true,
    },
    params,
  },
  responses: {
    200: { content: json(todo), description: "The updated todo" },
    400: invalid,
    404: notFound,
  },
});

const deleteTodo = createRoute({
  method: "delete",
  path: "/{id}",
  request: { params },
  responses: {
    200: { content: json(todo), description: "The deleted todo" },
    404: notFound,
  },
});

const todoNotFound = { message: "Todo not found" };

export const todoRoutes = ({ db }: Services) =>
  new OpenAPIHono()
    .openapi(listTodos, async (c) => {
      const rows = await db.todos.find().sort({ _id: 1 }).lean();

      return c.json(rows.map(toTodo), 200);
    })
    .openapi(createTodo, async (c) => {
      const created = await db.todos.create(c.req.valid("json"));

      return c.json(toTodo(created.toObject()), 201);
    })
    .openapi(updateTodo, async (c) => {
      const row = await db.todos
        .findByIdAndUpdate(c.req.valid("param").id, c.req.valid("json"), {
          returnDocument: "after",
        })
        .lean();

      if (row === null) {
        return c.json(todoNotFound, 404);
      }

      return c.json(toTodo(row), 200);
    })
    .openapi(deleteTodo, async (c) => {
      const row = await db.todos
        .findByIdAndDelete(c.req.valid("param").id)
        .lean();

      if (row === null) {
        return c.json(todoNotFound, 404);
      }

      return c.json(toTodo(row), 200);
    });
