import { defineConfig } from "void/config";

export default defineConfig({
  database: "pg",
  inference: { bindings: { db: true } },

  cloudflare: {
    name: "my-app",
    compatibility_date: "2026-10-01",
    compatibility_flags: ["nodejs_compat"],
  },
});
