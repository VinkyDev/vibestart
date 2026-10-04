import { os } from "@orpc/server";

import type { Context } from "#src/context.ts";

export const publicProcedure = os.$context<Context>();
