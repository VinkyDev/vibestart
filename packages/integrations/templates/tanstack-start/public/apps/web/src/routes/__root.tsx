import { Toaster } from "@my-app/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { Header } from "#src/components/header.tsx";

import appCss from "@my-app/ui/globals.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

const RootDocument = ({ children }: { children: ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <head>
      <HeadContent />
    </head>
    <body>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
      >
        {children}
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools buttonPosition="bottom-right" />
      <Scripts />
    </body>
  </html>
);

const RootLayout = () => (
  <div className="grid min-h-svh grid-rows-[auto_1fr]">
    <Header />
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Outlet />
    </main>
  </div>
);

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "my-app" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
  component: RootLayout,
});
