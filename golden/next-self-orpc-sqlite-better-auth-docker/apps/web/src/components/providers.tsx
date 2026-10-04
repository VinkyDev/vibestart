"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

import { Toaster } from "@my-app/ui/components/sonner";

import { getQueryClient } from "#src/lib/query-client.ts";

export const Providers = ({ children }: { children: ReactNode }) => {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools buttonPosition="bottom-right" />
      </QueryClientProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
};
