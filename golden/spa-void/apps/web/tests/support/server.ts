import { spawn, spawnSync } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { once } from "node:events";
import { fileURLToPath } from "node:url";

import { retry } from "es-toolkit/function";

export const e2eBaseURL = `http://localhost:${process.env.E2E_TEST_PORT ?? "3200"}`;

const webDir = fileURLToPath(new URL("../..", import.meta.url));

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

  const { pid } = child;

  const terminate = async (signal: "SIGTERM" | "SIGKILL") => {
    await Promise.all([
      once(child, "exit", { signal: AbortSignal.timeout(5000) }),
      Promise.resolve().then(() => {
        if (process.platform === "win32") {
          // taskkill may report already-exited descendants as errors.
          const result = spawnSync(
            "taskkill",
            ["/pid", String(pid), "/t", "/f"],
            {
              stdio: "ignore",
              timeout: 5000,
            }
          );

          if (result.error || result.status !== 0) {
            return child.kill();
          }

          return true;
        }

        return process.kill(-pid, signal);
      }),
    ]);
  };

  try {
    await terminate("SIGTERM");
  } catch (error) {
    if (process.platform === "win32") {
      throw error;
    }

    await terminate("SIGKILL");
  }
};

export const startTestServer = async (baseURL: string) => {
  const { port } = new URL(baseURL);
  const children: ChildProcess[] = [];

  const stopAll = async () => {
    const results = await Promise.allSettled(children.map(stop));

    const errors: unknown[] = [];

    for (const result of results) {
      if (result.status === "rejected") {
        errors.push(result.reason);
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, "Failed to stop test servers");
    }
  };

  try {
    children.push(
      start(
        webDir,
        [
          "node_modules/vite-plus/bin/vp",
          "dev",
          "--port",
          port,
          "--strictPort",
        ],
        { VOID_INSPECTOR_PORT: "false" }
      )
    );
    await waitForServer(`${baseURL}/`);
  } catch (error) {
    try {
      await stopAll();
    } catch (cleanupError) {
      throw new AggregateError(
        [error, cleanupError],
        "Test server startup and cleanup failed",
        { cause: cleanupError }
      );
    }

    throw error;
  }

  return stopAll;
};
