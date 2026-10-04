import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vite-plus/test";

import {
  isApiPath,
  isExternalUrl,
  isTrustedUrl,
  parseLoopbackOrigin,
  parseRendererUrl,
  rendererFile,
  rewriteToOrigin,
} from "#src/main/renderer-route.ts";

const root = mkdtempSync(path.join(tmpdir(), "renderer-"));
mkdirSync(path.join(root, "assets"));
writeFileSync(path.join(root, "index.html"), "<html></html>");
writeFileSync(path.join(root, "assets", "app.js"), "");

const fileOf = (requestUrl: string) => {
  const url = parseRendererUrl(requestUrl);
  return url === null ? null : rendererFile(url, root);
};

describe("the packaged renderer", () => {
  it("serves only its own origin", () => {
    expect(parseRendererUrl("https://app.localhost/settings")).not.toBeNull();
    expect(parseRendererUrl("https://example.com/")).toBeNull();
    expect(parseRendererUrl("http://app.localhost/")).toBeNull();
    expect(parseRendererUrl("app://bundle/")).toBeNull();
    expect(parseRendererUrl("not a url")).toBeNull();
  });

  it("maps a request to a file, and a route to index.html", () => {
    expect(fileOf("https://app.localhost/")).toBe(
      path.join(root, "index.html")
    );
    expect(fileOf("https://app.localhost/assets/app.js")).toBe(
      path.join(root, "assets", "app.js")
    );
    expect(fileOf("https://app.localhost/todos/1")).toBe(
      path.join(root, "index.html")
    );
  });

  it("does not invent a missing asset or leave the renderer folder", () => {
    expect(fileOf("https://app.localhost/assets/missing.js")).toBeNull();
    expect(fileOf("https://app.localhost/..%2f..%2fetc/passwd")).toBeNull();
    expect(fileOf("https://app.localhost/%00")).toBeNull();
    expect(fileOf("https://app.localhost/%E0%A4%A")).toBeNull();
  });
});

describe("the API proxy", () => {
  it("matches a prefix on a path boundary", () => {
    const apiPaths = ["/api", "/rpc"];
    expect(isApiPath("/api", apiPaths)).toBeTruthy();
    expect(isApiPath("/rpc/todos/list", apiPaths)).toBeTruthy();
    expect(isApiPath("/apiary", apiPaths)).toBeFalsy();
    expect(isApiPath("/api", [])).toBeFalsy();
  });

  it("keeps the path and query", () => {
    const url = new URL("https://app.localhost/rpc/todos?x=1");
    expect(rewriteToOrigin(url, "http://localhost:3000")).toBe(
      "http://localhost:3000/rpc/todos?x=1"
    );
  });
});

describe("trust", () => {
  it("IPC and navigation are trusted from the renderer only", () => {
    const dev = "http://localhost:5173";
    expect(isTrustedUrl("https://app.localhost/settings")).toBeTruthy();
    expect(isTrustedUrl("http://localhost:5173/todos", dev)).toBeTruthy();
    expect(isTrustedUrl("http://localhost:5173/")).toBeFalsy();
    expect(isTrustedUrl("https://evil.example/", dev)).toBeFalsy();
    expect(isTrustedUrl("", dev)).toBeFalsy();
  });

  it("only a loopback server is a dev renderer", () => {
    expect(parseLoopbackOrigin("http://localhost:5173/")).toBe(
      "http://localhost:5173"
    );
    expect(parseLoopbackOrigin("http://[::1]:5173")).toBe("http://[::1]:5173");
    expect(parseLoopbackOrigin("https://example.com")).toBeNull();
    expect(parseLoopbackOrigin("file:///etc/passwd")).toBeNull();
  });

  it("links open outside the app only for web and mail", () => {
    expect(isExternalUrl("https://example.com")).toBeTruthy();
    expect(isExternalUrl("mailto:dev@example.com")).toBeTruthy();
    expect(isExternalUrl("file:///etc/passwd")).toBeFalsy();
    expect(isExternalUrl("https://app.localhost/")).toBeFalsy();
  });
});
