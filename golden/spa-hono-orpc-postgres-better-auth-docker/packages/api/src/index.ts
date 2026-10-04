import type { RouterClient } from "@orpc/server";

import { health } from "#src/routers/health.ts";
import { todosRouter } from "#src/routers/todos.ts";

export type { Context } from "#src/context.ts";

export const appRouter = {
  health,
  todos: todosRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<AppRouter>;
