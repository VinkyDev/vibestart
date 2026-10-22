import { defineConfig } from "void/config";

export default defineConfig({
  database: "pg",
  inference: { bindings: { db: true } },
  cloudflare: {
    name: "my-app",
    // Local tooling infers its binding; deploy.ts requires an existing cache-disabled production ID.
    hyperdrive:
      process.env.HYPERDRIVE_ID === undefined
        ? undefined
        : [{ binding: "HYPERDRIVE", id: process.env.HYPERDRIVE_ID }],
    compatibility_date: "2026-10-01",
    // Without enable_request_signal, `request.signal` never aborts when the client disconnects.
    compatibility_flags: ["nodejs_compat", "enable_request_signal"],
  },
});
