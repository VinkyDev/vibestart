import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite-plus";

export default defineConfig(({ mode }) => {
  const { SERVER_URL = "http://localhost:3000" } = loadEnv(
    mode,
    import.meta.dirname,
    ""
  );

  return {
    plugins: [solid(), tailwindcss()],
    server: {
      proxy: {
        "/api": SERVER_URL,
      },
    },
  };
});
