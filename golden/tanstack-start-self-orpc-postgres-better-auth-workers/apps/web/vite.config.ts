import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite-plus";

export default defineConfig(({ command, mode }) => {
  // Build artifacts must not include the local database URL or auth secret.
  process.env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = String(
    command === "serve"
  );

  if (command === "serve") {
    const local = loadEnv(mode, import.meta.dirname, "");

    if (local.DATABASE_URL !== undefined) {
      process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE =
        local.DATABASE_URL;
    }

    for (const name of ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"]) {
      const value = local[name];

      if (value !== undefined) {
        process.env[name] = value;
      }
    }
  }

  return {
    plugins: [
      cloudflare({ inspectorPort: false, viteEnvironment: { name: "ssr" } }),
      tailwindcss(),
      tanstackStart(),
      react({ compiler: true }),
    ],
    server: { port: 3000 },
  };
});
