import { ORPCError, os } from "@orpc/server";

import type { Context } from "#src/context.ts";

export const publicProcedure = os.$context<Context>();

export const protectedProcedure = publicProcedure.use(
  async ({ context, next }) => {
    if (!context.session) {
      throw new ORPCError("UNAUTHORIZED");
    }
    return await next({ context: { session: context.session } });
  }
);
