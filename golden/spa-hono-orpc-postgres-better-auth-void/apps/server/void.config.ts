import { defineConfig } from "void/config";

export default defineConfig({
  database: "pg",
  inference: { appType: "void", bindings: { db: true } },
  routing: { notFound: "single-page-application" },
  cloudflare: {
    name: "my-app",
    compatibility_date: "2026-10-01",
    compatibility_flags: ["nodejs_compat"],
  },
});
