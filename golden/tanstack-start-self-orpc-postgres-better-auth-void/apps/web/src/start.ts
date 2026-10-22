import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";

import { withServices } from "#src/server/context.ts";

const services = createMiddleware().server(
  async ({ next, request }) =>
    await withServices(request, async () => {
      const result = await next();

      return result.response;
    })
);

const csrf = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrf, services],
}));
