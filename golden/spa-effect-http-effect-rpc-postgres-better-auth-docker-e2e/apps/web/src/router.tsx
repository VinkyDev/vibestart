import { RegistryProvider } from "@effect/atom-react";
import { createRouter } from "@tanstack/react-router";
import type { RouterHistory } from "@tanstack/react-router";

import { Loader } from "#src/components/loader.tsx";
import { routeTree } from "#src/routeTree.gen.ts";

export const createAppRouter = (history?: RouterHistory) =>
  createRouter({
    routeTree,
    history,
    context: { session: null },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: Loader,
    scrollRestoration: true,
    Wrap: ({ children }) => <RegistryProvider>{children}</RegistryProvider>,
  });

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
