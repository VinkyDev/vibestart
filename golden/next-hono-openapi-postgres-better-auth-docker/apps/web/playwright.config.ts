import { defineConfig, devices } from "@playwright/test";

import { e2eBaseURL } from "./tests/support/server.ts";

const ci = process.env.CI !== undefined;

export default defineConfig({
  // The dev server compiles a route on its first request, which is slow on a shared CI runner.
  expect: { timeout: 15_000 },
  forbidOnly: ci,
  fullyParallel: true,
  globalSetup: "./tests/e2e/global-setup.ts",
  projects: [{ name: "chromium", use: devices["Desktop Chrome"] }],
  reporter: ci ? [["github"], ["html", { open: "never" }]] : "list",
  testDir: "tests/e2e",
  testMatch: "**/*.e2e.ts",
  use: {
    baseURL: e2eBaseURL,
    trace: "retain-on-failure",
  },
  workers: ci ? 1 : undefined,
});
