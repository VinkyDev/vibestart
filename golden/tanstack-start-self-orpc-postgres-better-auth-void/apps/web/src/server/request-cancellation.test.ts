import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";

import type { Connect } from "vite-plus";
import { describe, expect, it, vi } from "vite-plus/test";

import { handleRequestError } from "../../config/request-cancellation.ts";

describe("dev request cancellation", () => {
  it("uses the four arguments Connect requires for error middleware", () => {
    expect(handleRequestError).toHaveLength(4);
  });

  it("contains an aborted incoming body", () => {
    const requestMessage = new IncomingMessage(new Socket());
    const responseMessage = new ServerResponse(requestMessage);
    const destroy = vi.spyOn(responseMessage, "destroy");
    const next = vi.fn<Connect.NextFunction>();
    handleRequestError(
      new Error("aborted"),
      Object.assign(requestMessage, { destroyed: true, complete: false }),
      responseMessage,
      next
    );
    expect(destroy).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });

  it("contains disconnects while the response is still streaming", () => {
    const requestMessage = new IncomingMessage(new Socket());
    const responseMessage = new ServerResponse(requestMessage);
    const destroy = vi.spyOn(responseMessage, "destroy");
    const next = vi.fn<Connect.NextFunction>();
    handleRequestError(
      new Error("aborted"),
      Object.assign(requestMessage, { destroyed: true, complete: true }),
      Object.assign(responseMessage, { destroyed: true }),
      next
    );
    expect(destroy).toHaveBeenCalledOnce();
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    { destroyed: false, complete: false },
    { destroyed: true, complete: true },
  ])(
    "keeps errors for an active or normally completed request: %o",
    (request) => {
      const failure = new Error("database unavailable");
      const requestMessage = new IncomingMessage(new Socket());
      const responseMessage = new ServerResponse(requestMessage);
      const destroy = vi.spyOn(responseMessage, "destroy");
      const next = vi.fn<Connect.NextFunction>();
      handleRequestError(
        failure,
        Object.assign(requestMessage, request),
        responseMessage,
        next
      );
      expect(next).toHaveBeenCalledExactlyOnceWith(failure);
      expect(destroy).not.toHaveBeenCalled();
    }
  );

  it("does not confuse a completed response with cancellation", () => {
    const failure = new Error("late server failure");
    const requestMessage = new IncomingMessage(new Socket());
    const responseMessage = new ServerResponse(requestMessage);
    const destroy = vi.spyOn(responseMessage, "destroy");
    const next = vi.fn<Connect.NextFunction>();
    responseMessage.end();
    handleRequestError(
      failure,
      Object.assign(requestMessage, { destroyed: true, complete: true }),
      Object.assign(responseMessage, { destroyed: true }),
      next
    );
    expect(next).toHaveBeenCalledExactlyOnceWith(failure);
    expect(destroy).not.toHaveBeenCalled();
  });
});
