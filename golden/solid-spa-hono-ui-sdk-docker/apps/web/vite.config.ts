import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite-plus";

export default defineConfig(({ mode }) => ({
  plugins: [solid(), tailwindcss()],
  server: {
    proxy: {
      "/api":
        loadEnv(mode, import.meta.dirname, "").SERVER_URL ??
        "http://localhost:3000",
    },
  },
}));
