import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "next-themes";

import { Toaster } from "@my-app/ui/components/sonner";

import { Header } from "#src/components/header.tsx";
import { getSession } from "#src/lib/auth.ts";
import type { Session } from "#src/lib/auth.ts";

interface RouterContext {
  session: Session | null;
}

const RootLayout = () => (
  <ThemeProvider
    attribute="class"
    defaultTheme="system"
    disableTransitionOnChange
    scriptProps={{ type: "application/json" }}
  >
    <HeadContent />
    <div className="grid min-h-svh grid-rows-[auto_1fr]">
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-14">
        <Outlet />
      </main>
    </div>
    <Toaster richColors />
    <TanStackRouterDevtools position="bottom-left" />
  </ThemeProvider>
);

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => ({ session: await getSession() }),
  head: () => ({
    meta: [{ title: "my-app" }],
  }),
  component: RootLayout,
});
