import { appRouter } from "@my-app/api";
import type { Context } from "@my-app/api";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import type { Context as HonoContext } from "hono";

import { auth, db } from "#src/context.ts";

const logServerError = (cause: unknown) => {
  if (!(cause instanceof ORPCError) || cause.status >= 500) {
    console.error(cause);
  }
};

const mount =
  (
    handler: RPCHandler<Context> | OpenAPIHandler<Context>,
    prefix: `/${string}`
  ) =>
  async (c: HonoContext) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const { matched, response } = await handler.handle(c.req.raw, {
      context: { db, session },
      prefix,
    });
    return matched
      ? c.newResponse(response.body, response)
      : await c.notFound();
  };

export const rpc = mount(
  new RPCHandler(appRouter, { interceptors: [onError(logServerError)] }),
  "/rpc"
);

export const openApi = mount(
  new OpenAPIHandler(appRouter, {
    interceptors: [onError(logServerError)],
    plugins: [
      new OpenAPIReferencePlugin({
        schemaConverters: [new ZodToJsonSchemaConverter()],
        specGenerateOptions: {
          info: {
            title: "my-app",
            version: "0.0.0",
          },
        },
      }),
    ],
  }),
  "/api"
);
