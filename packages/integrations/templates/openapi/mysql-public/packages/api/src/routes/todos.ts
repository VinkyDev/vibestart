import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { todos } from "@my-app/db/schema/todos";
import { eq } from "drizzle-orm";

import type { Services } from "#src/services.ts";

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

// MySQL has no `returning`, so a write finds its row by id.
export const todoRoutes = ({ db }: Services) => {
  const findTodo = (id: number) => db.query.todos.findFirst({ where: { id } });

  return new OpenAPIHono()
    .openapi(listTodos, async (c) =>
      c.json(await db.query.todos.findMany({ orderBy: { id: "asc" } }), 200)
    )
    .openapi(createTodo, async (c) => {
      const [created] = await db
        .insert(todos)
        .values(c.req.valid("json"))
        .$returningId();
      const todo =
        created === undefined ? undefined : await findTodo(created.id);
      if (todo === undefined) {
        throw new Error("The insert returned no row");
      }
      return c.json(todo, 201);
    })
    .openapi(updateTodo, async (c) => {
      const values = c.req.valid("json");
      const todo = await findTodo(c.req.valid("param").id);
      if (todo === undefined) {
        return c.json(todoNotFound, 404);
      }
      await db.update(todos).set(values).where(eq(todos.id, todo.id));
      return c.json({ ...todo, ...values }, 200);
    })
    .openapi(deleteTodo, async (c) => {
      const todo = await findTodo(c.req.valid("param").id);
      if (todo === undefined) {
        return c.json(todoNotFound, 404);
      }
      await db.delete(todos).where(eq(todos.id, todo.id));
      return c.json(todo, 200);
    });
};
