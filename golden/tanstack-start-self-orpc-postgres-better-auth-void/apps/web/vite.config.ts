import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";
import { voidPlugin } from "void";

// Void merges shell overrides; Wrangler must not overwrite them by reading .env again.
process.env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = "false";

// Void resolves void.config.ts from process.cwd(), including when `vp build apps/web` runs from the repo root.
const inWebRoot = () => {
  const cwd = process.cwd();
  process.chdir(import.meta.dirname);

  try {
    return voidPlugin();
  } finally {
    process.chdir(cwd);
  }
};

export default defineConfig({
  plugins: [
    inWebRoot(),
    tailwindcss(),
    tanstackStart(),
    react({ compiler: true }),
  ],
  server: { port: 3000 },
});
