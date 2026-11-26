import type { Context } from "@vibestart/core";

import { sqlDatabase } from "#/database.ts";

// Without a `client`, the MongoDB adapter runs no transactions, which a standalone server does not support.
export const authAdapter = (ctx: Context) => {
  if (ctx.has("mongoose")) {
    return {
      imports: [],
      call: "mongodbAdapter(db.connection.getClient().db())",
      dependency: "@better-auth/mongo-adapter",
      statement: 'import { mongodbAdapter } from "@better-auth/mongo-adapter";',
    };
  }

  const database = sqlDatabase(ctx);

  if (ctx.has("prisma")) {
    return {
      imports: [],
      call: `prismaAdapter(db, { provider: "${database.dialect}" })`,
      dependency: "@better-auth/prisma-adapter",
      statement: 'import { prismaAdapter } from "@better-auth/prisma-adapter";',
    };
  }

  const provider = database.id === "postgres" ? "pg" : database.id;

  return {
    imports: [`import * as schema from "${ctx.scope}/db/schema/auth";`],
    call: `drizzleAdapter(db, { provider: "${provider}", schema })`,
    dependency: "@better-auth/drizzle-adapter",
    statement:
      'import { drizzleAdapter } from "@better-auth/drizzle-adapter/relations-v2";',
  };
};
