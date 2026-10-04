import { appRouter } from "@my-app/api";
import type { Context } from "@my-app/api";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { ORPCError, onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";

import { auth, db } from "#src/server/context.ts";
import { handleRequest } from "#src/server/request.ts";

export const createContext = async (headers: Headers): Promise<Context> => ({
  db,
  session: await auth.api.getSession({ headers }),
});

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
  async ({ request }: { request: Request }) =>
    await handleRequest(request, async () => {
      const { response } = await handler.handle(request, {
        prefix,
        context: await createContext(request.headers),
      });
      return response ?? new Response("Not Found", { status: 404 });
    });

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
