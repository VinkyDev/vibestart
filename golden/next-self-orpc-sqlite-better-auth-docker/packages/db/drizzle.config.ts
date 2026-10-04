import { existsSync } from "node:fs";
import path from "node:path";

import { defineConfig } from "drizzle-kit";

const appDir = "../../apps/web";
const appEnvFile = `${appDir}/.env`;

if (existsSync(appEnvFile)) {
  process.loadEnvFile(appEnvFile);
}

export default defineConfig({
  dbCredentials: {
    url: path.resolve(appDir, process.env.DATABASE_URL ?? "local.db"),
  },
  dialect: "sqlite",
  out: "./src/migrations",
  schema: "./src/schema",
});
