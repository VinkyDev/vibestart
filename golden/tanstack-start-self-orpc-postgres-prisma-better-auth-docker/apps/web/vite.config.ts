import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite-plus";

import { requestCancellation } from "./config/request-cancellation.ts";

export default defineConfig(({ command }) => ({
  plugins: [
    tailwindcss(),
    tanstackStart(),
    nitro(),
    requestCancellation(),
    react({ compiler: true }),
  ],
  server: { port: 3000 },
  environments:
    command === "build"
      ? { ssr: { resolve: { noExternal: true } } }
      : undefined,
  pack: {
    entry: ["src/server/migrate.ts"],
    deps: { alwaysBundle: [/./u] },
    copy: [{ from: "../../packages/db/src/migrations", to: "dist" }],
  },
}));
