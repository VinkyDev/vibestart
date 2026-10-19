import { defineConfig } from "vite-plus";
import { voidPlugin } from "void/vite";

export default defineConfig({
  plugins: [voidPlugin()],
  publicDir: "../web/dist",
  server: { port: 3000 },
});
