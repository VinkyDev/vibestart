import { defineConfig } from "vite-plus";
import { voidPlugin } from "void";

// Void merges shell overrides; Wrangler must not overwrite them by reading .env again.
process.env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = "false";

export default defineConfig({
  plugins: [voidPlugin()],
  publicDir: "../web/dist",
  server: { port: 3000 },
});
