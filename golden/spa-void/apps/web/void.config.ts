import { defineConfig } from "void/config";

export default defineConfig({
  inference: { appType: "spa" },
  cloudflare: {
    name: "my-app",
    compatibility_date: "2026-10-01",
  },
});
