import { existsSync, statSync } from "node:fs";
import path from "node:path";

import { rendererHost } from "@my-app/electron";

const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
const externalProtocols = new Set(["http:", "https:", "mailto:"]);

const parseUrl = (value: string) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

export const parseHttpOrigin = (value: string) => {
  const url = parseUrl(value);
  return url?.protocol === "http:" || url?.protocol === "https:"
    ? url.origin
    : null;
};

export const parseLoopbackOrigin = (value: string) => {
  const origin = parseHttpOrigin(value);
  return origin !== null && loopbackHosts.has(new URL(origin).hostname)
    ? origin
    : null;
};

export const parseRendererUrl = (requestUrl: string) => {
  const url = parseUrl(requestUrl);
  return url?.protocol === "https:" && url.hostname === rendererHost
    ? url
    : null;
};

export const isTrustedUrl = (
  value: string,
  devOrigin: string | null = null
) => {
  const url = parseUrl(value);
  if (url === null) {
    return false;
  }
  return (
    parseRendererUrl(value) !== null ||
    (devOrigin !== null && url.origin === devOrigin)
  );
};

export const isExternalUrl = (value: string) => {
  const url = parseUrl(value);
  return (
    url !== null &&
    externalProtocols.has(url.protocol) &&
    parseRendererUrl(value) === null
  );
};

export const isApiPath = (pathname: string, apiPaths: readonly string[]) =>
  apiPaths.some(
    (apiPath) => pathname === apiPath || pathname.startsWith(`${apiPath}/`)
  );

export const rewriteToOrigin = (url: URL, origin: string) =>
  new URL(`${url.pathname}${url.search}`, origin).href;

const isFile = (filePath: string) =>
  existsSync(filePath) && statSync(filePath).isFile();

// A path without an extension is a client-side route and gets `index.html`. Nothing outside `root` is served.
export const rendererFile = (url: URL, root: string) => {
  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }
  if (pathname.includes("\0")) {
    return null;
  }
  const mapped = path.resolve(root, `.${pathname}`);
  const relative = path.relative(root, mapped);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }
  if (isFile(mapped)) {
    return mapped;
  }
  const index = path.join(root, "index.html");
  return path.extname(pathname) === "" && isFile(index) ? index : null;
};
