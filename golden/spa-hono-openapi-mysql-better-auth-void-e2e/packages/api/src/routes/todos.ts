import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

import { todos } from "@my-app/db/schema/todos";

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
    userId: z.string(),
  })
  .openapi("Todo");

const params = z.object({
  id: z.coerce
    .number()
    .int()
    .positive()
    .openapi({ param: { in: "path", name: "id" } }),
});

const message = json(z.object({ message: z.string() }));

const invalid = { description: "The request does not match its schema" };

const unauthorized = { content: message, description: "No session" };

// Someone else's todo is not found either, which does not reveal that the id exists.
const notFound = {
  content: message,
  description: "The user has no todo with this id",
};

const listTodos = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: json(z.array(todo)),
      description: "The user's todos, oldest first",
    },
    401: unauthorized,
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
    401: unauthorized,
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
    401: unauthorized,
    404: notFound,
  },
});

const deleteTodo = createRoute({
  method: "delete",
  path: "/{id}",
  request: { params },
  responses: {
    200: { content: json(todo), description: "The deleted todo" },
    401: unauthorized,
    404: notFound,
  },
});

const todoNotFound = { message: "Todo not found" };

export const todoRoutes = ({ auth, db }: Services) => {
  const routes = new OpenAPIHono<{ Variables: { userId: string } }>();

  // On the sub-app, so a route added here cannot skip the check.
  routes.use(async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      throw new HTTPException(401, {
        res: c.json({ message: "Sign in first" }, 401),
      });
    }

    c.set("userId", session.user.id);
    await next();
  });

  // MySQL has no `returning`, so a write finds the user's row by id first.
  const findTodo = (id: number, userId: string) =>
    db.query.todos.findFirst({ where: { id, userId } });

  return routes
    .openapi(listTodos, async (c) => {
      const rows = await db.query.todos.findMany({
        orderBy: { id: "asc" },
        where: { userId: c.var.userId },
      });

      return c.json(rows, 200);
    })
    .openapi(createTodo, async (c) => {
      const [created] = await db
        .insert(todos)
        .values({ ...c.req.valid("json"), userId: c.var.userId })
        .$returningId();

      const row =
        created === undefined
          ? undefined
          : await findTodo(created.id, c.var.userId);

      if (row === undefined) {
        throw new Error("The insert returned no row");
      }

      return c.json(row, 201);
    })
    .openapi(updateTodo, async (c) => {
      const values = c.req.valid("json");
      const row = await findTodo(c.req.valid("param").id, c.var.userId);

      if (row === undefined) {
        return c.json(todoNotFound, 404);
      }

      await db.update(todos).set(values).where(eq(todos.id, row.id));

      return c.json({ ...row, ...values }, 200);
    })
    .openapi(deleteTodo, async (c) => {
      const row = await findTodo(c.req.valid("param").id, c.var.userId);

      if (row === undefined) {
        return c.json(todoNotFound, 404);
      }

      await db.delete(todos).where(eq(todos.id, row.id));

      return c.json(row, 200);
    });
};
