import "@my-app/ui/globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Header } from "#src/components/header.tsx";
import { Providers } from "#src/components/providers.tsx";

export const metadata: Metadata = {
  title: "my-app",
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en" suppressHydrationWarning>
    <body>
      <Providers>
        <div className="grid min-h-svh grid-rows-[auto_1fr]">
          <Header />
          <main className="mx-auto w-full max-w-2xl px-4 py-8">{children}</main>
        </div>
      </Providers>
    </body>
  </html>
);

export default RootLayout;
