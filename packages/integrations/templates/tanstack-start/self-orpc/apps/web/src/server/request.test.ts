import { describe, expect, it } from "vite-plus/test";

import { handleRequest } from "./request.ts";

const url = "http://localhost/rpc/todos/list";

describe("request cancellation", () => {
  it("returns a successful response unchanged", async () => {
    const response = new Response("ok");
    await expect(
      handleRequest(
        new Request(url),
        async () => await Promise.resolve(response)
      )
    ).resolves.toBe(response);
  });

  it("does not start work for a request already cancelled", async () => {
    const controller = new AbortController();
    controller.abort();
    let calls = 0;
    const response = await handleRequest(
      new Request(url, { signal: controller.signal }),
      async () => {
        calls += 1;
        return await Promise.resolve(new Response("ok"));
      }
    );
    expect({ calls, status: response.status }).toStrictEqual({
      calls: 0,
      status: 499,
    });
  });

  it("reads the lazy signal before awaiting session context", async () => {
    const request = new Request(url);
    let listening = false;
    const controller = new AbortController();
    Object.defineProperty(request, "signal", {
      get: () => {
        listening = true;
        return controller.signal;
      },
    });
    await handleRequest(request, async () => {
      expect(listening).toBeTruthy();
      return await Promise.resolve(new Response("ok"));
    });
  });

  it("contains cancellation while asynchronous context is loading", async () => {
    const controller = new AbortController();
    const error = new DOMException("The request was aborted.", "AbortError");
    const response = await handleRequest(
      new Request(url, { signal: controller.signal }),
      async () => {
        await Promise.resolve();
        controller.abort(error);
        throw error;
      }
    );
    expect(response.status).toBe(499);
  });

  it("contains a request body stream error after the client disconnects", async () => {
    const controller = new AbortController();
    const stream = new TransformStream();
    const init = {
      body: stream.readable,
      duplex: "half",
      method: "POST",
      signal: controller.signal,
    };
    const request = new Request(url, init);
    const response = handleRequest(
      request,
      async () => new Response(await request.text())
    );
    const error = Object.assign(new Error("aborted"), { code: "ECONNRESET" });
    controller.abort(error);
    await stream.writable.abort(error);
    const result = await response;
    expect(result.status).toBe(499);
  });

  it.each([
    new Error("database unavailable"),
    new DOMException("abort from another operation", "AbortError"),
  ])(
    "preserves an error when this request is still active: %s",
    async (failure) => {
      await expect(
        handleRequest(new Request(url), async () => {
          await Promise.resolve();
          throw failure;
        })
      ).rejects.toBe(failure);
    }
  );
});
