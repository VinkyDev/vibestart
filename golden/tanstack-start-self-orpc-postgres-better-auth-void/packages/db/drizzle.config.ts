import { existsSync } from "node:fs";

import { defineConfig } from "drizzle-kit";

const serverEnvFile = "../../apps/web/.env";

if (existsSync(serverEnvFile)) {
  process.loadEnvFile(serverEnvFile);
}

export default defineConfig({
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  dialect: "postgresql",
  out: "./src/migrations",
  schema: "./src/schema",
});
