import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";

import { toTodo } from "@my-app/db";

import type { ApiEnv } from "#src/services.ts";

const json = <T extends z.ZodType>(schema: T) => ({
  "application/json": { schema },
});

const todo = z
  .object({
    completed: z.boolean(),
    createdAt: z.iso.datetime(),
    id: z.string(),
    title: z.string(),
    userId: z.string(),
  })
  .openapi("Todo");

// An ObjectId as the API spells it; anything else could never name a todo.
const params = z.object({
  id: z
    .string()
    .regex(/^[\da-f]{24}$/u)
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

export const todoRoutes = () => {
  const routes = new OpenAPIHono<TodoEnv>();

  // On the sub-app, so a route added here cannot skip the check.
  routes.use(async (c, next) => {
    const session = await c.var.services.auth.api.getSession({ headers: c.req.raw.headers });

    if (!session) {
      throw new HTTPException(401, {
        res: c.json({ message: "Sign in first" }, 401),
      });
    }

    c.set("userId", session.user.id);
    await next();
  });

  // Each write matches the user's id too: someone else's todo is not found either.
  return routes
    .openapi(listTodos, async (c) => {
      const { db } = c.var.services;

      const rows = await db.todos
        .find({ userId: c.var.userId })
        .sort({ _id: 1 })
        .lean();

      return c.json(rows.map(toTodo), 200);
    })
    .openapi(createTodo, async (c) => {
      const { db } = c.var.services;

      const created = await db.todos.create({
        ...c.req.valid("json"),
        userId: c.var.userId,
      });

      return c.json(toTodo(created.toObject()), 201);
    })
    .openapi(updateTodo, async (c) => {
      const { db } = c.var.services;

      const row = await db.todos
        .findOneAndUpdate(
          { _id: c.req.valid("param").id, userId: c.var.userId },
          c.req.valid("json"),
          { returnDocument: "after" }
        )
        .lean();

      if (row === null) {
        return c.json(todoNotFound, 404);
      }

      return c.json(toTodo(row), 200);
    })
    .openapi(deleteTodo, async (c) => {
      const { db } = c.var.services;

      const row = await db.todos
        .findOneAndDelete({ _id: c.req.valid("param").id, userId: c.var.userId })
        .lean();

      if (row === null) {
        return c.json(todoNotFound, 404);
      }

      return c.json(toTodo(row), 200);
    });
};
