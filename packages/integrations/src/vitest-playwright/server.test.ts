import { ChildProcess } from "node:child_process";
import type { SpawnSyncReturns } from "node:child_process";
import { once } from "node:events";
import { stripTypeScriptTypes } from "node:module";
import { runInNewContext } from "node:vm";

import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { compose, defaultAddons, generate } from "@vibestart/core";

import { registry } from "#/registry.ts";

const { files } = await generate(
  registry,
  {
    addons: defaultAddons(registry),
    channel: "recommended",
    stack: compose(registry, { framework: "next" }),
  },
  { name: "test-app" }
);
const server = files.find(
  (file) => file.path === "apps/web/tests/support/server.ts"
);
const stopSource = server?.content.match(
  /const stop = async[\s\S]+?(?=\nexport const startTestServer)/u
)?.[0];
if (stopSource === undefined) {
  throw new Error("Generated test server has no stop helper");
}
const code = `${stripTypeScriptTypes(stopSource)}\nstop(child);`;
type TaskkillResult = Pick<SpawnSyncReturns<Buffer>, "status" | "error">;

// Exercise generated code with OS calls replaced; no real process or port is needed.
const harness = (platform = "win32") => {
  const child = Object.assign(new ChildProcess(), {
    pid: 1234,
    kill: vi.fn<ChildProcess["kill"]>(() => false),
  });
  const taskkill = vi.fn<() => TaskkillResult>(() => ({
    status: 0,
  }));
  const kill = vi.fn<typeof process.kill>();
  const controller = new AbortController();
  const timeout = vi.fn<typeof AbortSignal.timeout>((delay) => {
    setTimeout(() => {
      controller.abort();
    }, delay);
    return controller.signal;
  });
  const context = {
    child,
    AbortSignal: { timeout },
    once,
    process: { platform, kill },
    spawnSync: taskkill,
  };
  return {
    child,
    taskkill,
    kill,
    timeout,
    stop: async () => {
      const result: unknown = runInNewContext(code, context);
      await result;
    },
    exit: () => {
      Object.assign(child, { exitCode: 0 });
      child.emit("exit", 0, null);
    },
  };
};

describe("generated test-server teardown", () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it.each([0, 128])(
    "waits for exit after taskkill status %s",
    async (status) => {
      vi.useFakeTimers();
      const h = harness();
      h.taskkill.mockReturnValue({ status });
      let completed = false;
      const stopped = h.stop().then(() => {
        completed = true;
      });
      await vi.advanceTimersByTimeAsync(100);
      expect(completed).toBeFalsy();
      expect(h.taskkill).toHaveBeenCalledWith(
        "taskkill",
        ["/pid", "1234", "/t", "/f"],
        { stdio: "ignore", timeout: 5000 }
      );
      expect(h.child.kill).toHaveBeenCalledTimes(status === 0 ? 0 : 1);
      h.exit();
      await stopped;
      expect(completed).toBeTruthy();
      expect(h.child.listenerCount("exit")).toBe(0);
    }
  );

  it.each([
    { status: null, error: new Error("spawnSync taskkill ENOENT") },
    { status: null, error: new Error("spawnSync taskkill ETIMEDOUT") },
    { status: 1 },
  ])("terminates the direct child when taskkill fails: %j", async (result) => {
    vi.useFakeTimers();
    const h = harness();
    h.taskkill.mockReturnValue(result);
    h.child.kill.mockImplementation(() => {
      h.exit();
      return true;
    });
    await h.stop();
    expect(h.child.kill).toHaveBeenCalledOnce();
    expect(h.child.listenerCount("exit")).toBe(0);
  });

  it.each([0, 1, null])(
    "rejects if the server stays alive after status %s",
    async (status) => {
      vi.useFakeTimers();
      const h = harness();
      h.taskkill.mockReturnValue({ status });
      await Promise.all([
        expect(h.stop()).rejects.toMatchObject({ name: "AbortError" }),
        vi.advanceTimersByTimeAsync(5000),
      ]);
      expect(h.child.listenerCount("exit")).toBe(0);
      expect(h.child.listenerCount("error")).toBe(0);
    }
  );

  it.each(["linux", "darwin"])(
    "keeps process-group shutdown on %s",
    async (platform) => {
      const h = harness(platform);
      const stopped = h.stop();
      expect(h.kill).toHaveBeenCalledWith(-1234, "SIGTERM");
      expect(h.taskkill).not.toHaveBeenCalled();
      expect(h.timeout).not.toHaveBeenCalled();
      h.exit();
      await stopped;
    }
  );

  it.each([{ pid: undefined }, { exitCode: 0 }, { signalCode: "SIGTERM" }])(
    "skips a child that has already stopped: %j",
    async (state) => {
      const h = harness();
      Object.assign(h.child, state);
      await h.stop();
      expect(h.taskkill).not.toHaveBeenCalled();
      expect(h.child.kill).not.toHaveBeenCalled();
      expect(h.child.listenerCount("exit")).toBe(0);
    }
  );
});
