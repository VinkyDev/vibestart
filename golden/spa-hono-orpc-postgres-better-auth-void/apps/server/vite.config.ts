import { defineConfig } from "vite-plus";
import { voidPlugin } from "void";

export default defineConfig({
  plugins: [voidPlugin()],
  publicDir: "../web/dist",
  server: { port: 3000 },
});
