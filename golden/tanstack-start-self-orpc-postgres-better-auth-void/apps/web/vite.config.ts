import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";
import { voidPlugin } from "void";

export default defineConfig({
  plugins: [
    voidPlugin(),
    tailwindcss(),
    tanstackStart(),
    react({ compiler: true }),
  ],
  server: { port: 3000 },
});
