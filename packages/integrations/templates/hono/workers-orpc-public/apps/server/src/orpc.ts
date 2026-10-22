import { appRouter } from "@my-app/api";
import type { Context } from "@my-app/api";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import type { Context as HonoContext } from "hono";

import type { Services } from "#src/context.ts";

const logServerError = (cause: unknown) => {
  if (!(cause instanceof ORPCError) || cause.status >= 500) {
    console.error(cause);
  }
};

const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [onError(logServerError)],
});

const openApiHandler = new OpenAPIHandler(appRouter, {
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
});

// Handlers are shared by the isolate; services belong to the request.
export const createRpc = ({ db }: Services) => {
  const mount =
    (
      handler: RPCHandler<Context> | OpenAPIHandler<Context>,
      prefix: `/${string}`
    ) =>
    async (c: HonoContext) => {
      const { matched, response } = await handler.handle(c.req.raw, {
        context: { db },
        prefix,
      });

      return matched
        ? c.newResponse(response.body, response)
        : await c.notFound();
    };

  return {
    openApi: mount(openApiHandler, "/api"),
    rpc: mount(rpcHandler, "/api/rpc"),
  };
};
