import { existsSync } from "node:fs";

import { defineConfig } from "prisma/config";

const serverEnvFile = "../../apps/web/.env";

if (existsSync(serverEnvFile)) {
  process.loadEnvFile(serverEnvFile);
}

export default defineConfig({
  datasource: { url: process.env.DATABASE_URL ?? "" },
  migrations: { path: "src/migrations" },
  schema: "src/schema",
});
