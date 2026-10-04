import { createRouter } from "@tanstack/react-router";

import { routeTree } from "#/routeTree.gen.ts";

export const createAppRouter = () =>
  createRouter({
    defaultPreload: "intent",
    routeTree,
    scrollRestoration: true,
  });

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
