import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

import { todos } from "@my-app/db/schema/todos";

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

// The session check below sets `userId` beside the `services` the server provides.
interface TodoEnv {
  Variables: ApiEnv["Variables"] & { userId: string };
}

// MySQL has no `returning`, so a write finds the user's row by id first.
const findTodo = (db: Services["db"], id: number, userId: string) =>
  db.query.todos.findFirst({ where: { id, userId } });

export const todoRoutes = () => {
  const routes = new OpenAPIHono<TodoEnv>();

  // On the sub-app, so a route added here cannot skip the check.
  routes.use(async (c, next) => {
    const session = await c.var.services.auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      throw new HTTPException(401, {
        res: c.json({ message: "Sign in first" }, 401),
      });
    }

    c.set("userId", session.user.id);
    await next();
  });

  return routes
    .openapi(listTodos, async (c) => {
      const { db } = c.var.services;

      const rows = await db.query.todos.findMany({
        orderBy: { id: "asc" },
        where: { userId: c.var.userId },
      });

      return c.json(rows, 200);
    })
    .openapi(createTodo, async (c) => {
      const { db } = c.var.services;

      const [created] = await db
        .insert(todos)
        .values({ ...c.req.valid("json"), userId: c.var.userId })
        .$returningId();

      const row =
        created === undefined
          ? undefined
          : await findTodo(db, created.id, c.var.userId);

      if (row === undefined) {
        throw new Error("The insert returned no row");
      }

      return c.json(row, 201);
    })
    .openapi(updateTodo, async (c) => {
      const { db } = c.var.services;

      const values = c.req.valid("json");
      const row = await findTodo(db, c.req.valid("param").id, c.var.userId);

      if (row === undefined) {
        return c.json(todoNotFound, 404);
      }

      await db.update(todos).set(values).where(eq(todos.id, row.id));

      return c.json({ ...row, ...values }, 200);
    })
    .openapi(deleteTodo, async (c) => {
      const { db } = c.var.services;

      const row = await findTodo(db, c.req.valid("param").id, c.var.userId);

      if (row === undefined) {
        return c.json(todoNotFound, 404);
      }

      await db.delete(todos).where(eq(todos.id, row.id));

      return c.json(row, 200);
    });
};
