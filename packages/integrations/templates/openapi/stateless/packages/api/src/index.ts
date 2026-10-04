import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";

import { healthRoutes } from "#src/routes/health.ts";

export const createApi = () => {
  const api = new OpenAPIHono().route("/health", healthRoutes());

  // The server mounts the API at `/api`, which the document and the reference page resolve against.
  api.doc31("/openapi.json", {
    info: { title: "my-app", version: "0.0.0" },
    openapi: "3.1.0",
    servers: [{ url: "/api" }],
  });
  api.get("/", Scalar({ url: "/api/openapi.json" }));

  return api;
};

export type Api = ReturnType<typeof createApi>;
