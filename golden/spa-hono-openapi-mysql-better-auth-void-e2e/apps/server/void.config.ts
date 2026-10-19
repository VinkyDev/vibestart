import { defineConfig } from "void/config";

export default defineConfig({
  database: "mysql",
  inference: { appType: "void", bindings: { db: true } },
  routing: { notFound: "single-page-application" },
  cloudflare: {
    name: "my-app",
    compatibility_date: "2026-10-01",
    // Without enable_request_signal, `request.signal` never aborts when the client disconnects.
    compatibility_flags: ["nodejs_compat", "enable_request_signal"],
  },
});
