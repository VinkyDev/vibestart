import { web } from "@e2e-dev/web";
import type { E2EConfig } from "e2e";

import { e2eBaseURL } from "./tests/support/server.ts";

// The app command inherits only PATH, HOME, and the temp directories; pass on what the stack reads from the shell.
const forwarded = Object.fromEntries(
  ["CI", "DATABASE_URL"].flatMap((name) => {
    const value = process.env[name];
    return value === undefined ? [] : [[name, value] as const];
  })
);

export default {
  assertionTimeout: 15_000,
  retries: 0,
  targets: [
    {
      app: {
        command: {
          args: ["tests/support/start.ts"],
          env: { ...forwarded, E2E_TEST_PORT: new URL(e2eBaseURL).port },
          executable: process.execPath,
          log: ".e2e/server.log",
          startupTimeout: 120_000,
        },
        url: e2eBaseURL,
      },
      engine: web(),
    },
  ],
  tests: "tests/e2e/**/*.e2e.ts",
  trace: "retain-on-failure",
} satisfies E2EConfig;
