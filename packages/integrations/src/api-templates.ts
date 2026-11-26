import type { Context } from "@vibestart/core";

import { ormId } from "#/database.ts";
import { apiVariant, authVariant, todosExample } from "#/example.ts";
import { templateFiles } from "#/templates.ts";

const todosModule = (ctx: Context) => {
  if (ctx.has("prisma") || ctx.has("mongoose")) {
    return `${ormId(ctx)}-${authVariant(ctx.stack)}`;
  }

  // MySQL has no `returning`, so Drizzle reads a row back after each write.
  return ctx.has("mysql")
    ? `drizzle-mysql-${authVariant(ctx.stack)}`
    : undefined;
};

/** The API's template set, with the todos module at `todos` written for the stack's ORM and database. */
export const apiTemplates = (ctx: Context, set: string, todos: string) => {
  const module = todosExample(ctx.stack) ? todosModule(ctx) : undefined;

  return module === undefined
    ? templateFiles(ctx, `${set}/${apiVariant(ctx.stack)}`)
    : [
        ...templateFiles(ctx, `${set}/${apiVariant(ctx.stack)}`, {
          except: [todos],
        }),
        ...templateFiles(ctx, `${set}/${module}`),
      ];
};
