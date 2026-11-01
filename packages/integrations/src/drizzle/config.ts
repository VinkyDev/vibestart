import type { Context } from "@vibestart/core";

import { serverApp } from "#/app.ts";

// drizzle-kit runs from `packages/db`, so it loads the server's `.env` itself.
export const drizzleConfig = (ctx: Context) => {
  const { dir } = serverApp(ctx);

  if (ctx.has("sqlite")) {
    const webDir = `../../${dir}`;

    return `import { existsSync } from "node:fs";
import path from "node:path";

import { defineConfig } from "drizzle-kit";

const appDir = "${webDir}";
const appEnvFile = \`\${appDir}/.env\`;

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
`;
  }

  return `import { existsSync } from "node:fs";

import { defineConfig } from "drizzle-kit";

const serverEnvFile = "../../${dir}/.env";

if (existsSync(serverEnvFile)) {
  process.loadEnvFile(serverEnvFile);
}

export default defineConfig({
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  dialect: "${ctx.has("mysql") ? "mysql" : "postgresql"}",
  out: "./src/migrations",
  schema: "./src/schema",
});
`;
};
