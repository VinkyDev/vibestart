import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { Effect, Redacted, Schedule } from "effect";
import { ChildProcess } from "effect/process";

import { makeTestDatabase } from "@my-app/db/testing";

export const e2eBaseURL = `http://localhost:${process.env.E2E_TEST_PORT ?? "3200"}`;

const webDir = fileURLToPath(new URL("../..", import.meta.url));
const serverDir = fileURLToPath(new URL("../../../server", import.meta.url));
const envFile = `${serverDir}/.env`;

const waitForServer = Effect.fn("TestServer.waitForServer")(function* (
  url: string
) {
  yield* Effect.tryPromise(async (signal) => {
    const response = await fetch(url, { signal });
    await response.arrayBuffer();

    if (!response.ok) {
      throw new Error(`Server did not become healthy at ${url}`);
    }
  }).pipe(
    Effect.retry(Schedule.spaced("100 millis")),
    Effect.timeout("60 seconds")
  );
});

const start = (cwd: string, args: string[], env: Record<string, string>) =>
  ChildProcess.make(process.execPath, args, {
    cwd,
    env,
    extendEnv: true,
    forceKillAfter: "5 seconds",
    // Vite closes its server on stdin EOF outside CI.
    stdin: "pipe",
    stdout: "inherit",
    stderr: "inherit",
  });

export const testServer = Effect.gen(function* () {
  yield* Effect.sync(() => {
    if (existsSync(envFile)) {
      process.loadEnvFile(envFile);
    }
  });

  const webPort = Number(new URL(e2eBaseURL).port);
  const serverPort = String(webPort + 1);
  const databaseUrl = yield* makeTestDatabase;

  yield* start(serverDir, ["src/index.ts"], {
    BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters",
    BETTER_AUTH_URL: e2eBaseURL,
    DATABASE_URL: Redacted.value(databaseUrl),
    PORT: serverPort,
  });
  yield* waitForServer(`http://localhost:${serverPort}/api/health`);
  yield* start(
    webDir,
    [
      "node_modules/vite-plus/bin/vp",
      "dev",
      "--port",
      String(webPort),
      "--strictPort",
    ],
    {
      SERVER_URL: `http://localhost:${serverPort}`,
    }
  );
  yield* waitForServer(`${e2eBaseURL}/api/health`);
  yield* Effect.forEach(
    ["/", "/login", "/todos"],
    (route) => waitForServer(`${e2eBaseURL}${route}`),
    { concurrency: "unbounded" }
  );
});
