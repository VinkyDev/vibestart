import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";

import type { ApiEnv, Services } from "#src/services.ts";

const json = <T extends z.ZodType>(schema: T) => ({
  "application/json": { schema },
});

const todo = z
  .object({
    completed: z.boolean(),
    createdAt: z.iso.datetime(),
    id: z.int(),
    title: z.string(),
  })
  .openapi("Todo");

const params = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
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

const findTodo = async (db: Services["db"], id: number) =>
  await db.todo.findUnique({ where: { id } });

export const todoRoutes = () =>
  new OpenAPIHono<ApiEnv>()
  .openapi(listTodos, async (c) =>
    c.json(await c.var.services.db.todo.findMany({ orderBy: { id: "asc" } }), 200)
  )
  .openapi(createTodo, async (c) => {
    const { db } = c.var.services;

    const row = await db.todo.create({ data: c.req.valid("json") });

    return c.json(row, 201);
  })
  .openapi(updateTodo, async (c) => {
    const { db } = c.var.services;

    const values = c.req.valid("json");
    const row = await findTodo(db, c.req.valid("param").id);

    if (row === null) {
      return c.json(todoNotFound, 404);
    }

    return c.json(
      await db.todo.update({ data: values, where: { id: row.id } }),
      200
    );
  })
  .openapi(deleteTodo, async (c) => {
    const { db } = c.var.services;

    const row = await findTodo(db, c.req.valid("param").id);

    if (row === null) {
      return c.json(todoNotFound, 404);
    }

    await db.todo.delete({ where: { id: row.id } });

    return c.json(row, 200);
  });
