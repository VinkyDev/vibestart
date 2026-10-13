import type { Connect, Plugin } from "vite-plus";

export const handleRequestError: Connect.ErrorHandleFunction = (
  error,
  request,
  response,
  next
) => {
  if (
    (request.destroyed && !request.complete) ||
    (response.destroyed && !response.writableEnded)
  ) {
    response.destroy();
    return;
  }
  next(error);
};

export const requestCancellation = (): Plugin => ({
  name: "request-cancellation",
  configureServer: (server) => () => {
    // Nitro may reject on client disconnect before the Fetch handler runs, so this goes after its proxy and before Vite's error middleware.
    server.middlewares.use(handleRequestError);
  },
});
