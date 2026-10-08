import { spawn, spawnSync } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { retry } from "es-toolkit/function";

import { createTestDatabase } from "@my-app/db/testing";

import { closeTestHttp } from "./http.ts";

export const e2eBaseURL = `http://localhost:${process.env.E2E_TEST_PORT ?? "3200"}`;

const webDir = fileURLToPath(new URL("../..", import.meta.url));
const envFile = `${webDir}/.env`;

const waitForServer = async (url: string, attempts = 100): Promise<void> => {
  await retry(
    async () => {
      const response = await fetch(url);
      await response.arrayBuffer();
      if (!response.ok) {
        throw new Error(`Server did not become healthy at ${url}`);
      }
    },
    { delay: 100, retries: attempts }
  );
};

const start = (cwd: string, args: string[], env: Record<string, string>) =>
  spawn(process.execPath, args, {
    cwd,
    detached: true,
    env: { ...process.env, ...env },
    // Vite closes its server on stdin EOF outside CI; keep this pipe open until teardown.
    stdio: ["pipe", "inherit", "inherit"],
  });

const stop = async (child: ChildProcess) => {
  if (
    child.pid === undefined ||
    child.exitCode !== null ||
    child.signalCode !== null
  ) {
    return;
  }
  const exited = once(child, "exit", {
    signal:
      process.platform === "win32" ? AbortSignal.timeout(5000) : undefined,
  });
  if (process.platform === "win32") {
    // taskkill may report already-exited descendants as errors.
    const result = spawnSync(
      "taskkill",
      ["/pid", String(child.pid), "/t", "/f"],
      {
        stdio: "ignore",
        timeout: 5000,
      }
    );
    if (result.error || result.status !== 0) {
      child.kill();
    }
  } else {
    process.kill(-child.pid, "SIGTERM");
  }
  await exited;
};

export const startTestServer = async (baseURL: string) => {
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
  const { port } = new URL(baseURL);
  const database = await createTestDatabase();
  const children: ChildProcess[] = [];
  const stopAll = async () => {
    await Promise.all(children.map(stop));
    await database.remove();
    await closeTestHttp();
  };

  try {
    children.push(
      start(
        webDir,
        [
          "node_modules/vite-plus/bin/vp",
          "dev",
          "--host",
          "127.0.0.1",
          "--port",
          port,
          "--strictPort",
        ],
        {
          BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters",
          BETTER_AUTH_URL: baseURL,
          DATABASE_URL: database.url,
        }
      )
    );
    await waitForServer(`${baseURL}/api/health`);
    await Promise.all(
      ["/", "/login", "/todos"].map(async (route) => {
        const response = await fetch(`${baseURL}${route}`);
        await response.arrayBuffer();
      })
    );
  } catch (error) {
    await stopAll();
    throw error;
  }
  return stopAll;
};
