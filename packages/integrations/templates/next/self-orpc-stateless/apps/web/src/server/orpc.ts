import "server-only";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";

import { appRouter } from "@my-app/api";
import type { Context } from "@my-app/api";

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
  async (request: Request) => {
    const { response } = await handler.handle(request, {
      context: {},
      prefix,
    });
    return response ?? new Response("Not Found", { status: 404 });
  };

export const handleRpc = mount(
  new RPCHandler(appRouter, { interceptors: [onError(logServerError)] }),
  "/rpc"
);

export const handleOpenApi = mount(
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
