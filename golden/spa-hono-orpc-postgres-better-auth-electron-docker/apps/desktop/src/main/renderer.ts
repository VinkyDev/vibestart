import { pathToFileURL } from "node:url";

import { net, protocol } from "electron";

import { apiPaths } from "#src/main/config.ts";
import {
  isApiPath,
  parseRendererUrl,
  rendererFile,
  rewriteToOrigin,
} from "#src/main/renderer-route.ts";

type ProxyInit = RequestInit & { duplex?: "half" };

const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
].join("; ");

const notFound = () => new Response("Not found", { status: 404 });

const proxy = async (
  request: Request,
  apiOrigin: string,
  clientOrigin: string
) => {
  const url = new URL(request.url);
  const headers = new Headers(request.headers);
  // Better Auth checks `Origin` against `BETTER_AUTH_URL` and `trustedOrigins`, not the upstream API host.
  headers.set("origin", clientOrigin);
  headers.delete("referer");
  const init: ProxyInit = {
    // The session cookie belongs to the API's origin, so `net.fetch` keeps it in the session's cookie jar.
    credentials: "include",
    headers,
    method: request.method,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
    init.duplex = "half";
  }
  try {
    return await net.fetch(rewriteToOrigin(url, apiOrigin), init);
  } catch {
    return new Response("The API is unreachable", { status: 502 });
  }
};

export const serveRenderer = ({
  apiOrigin,
  rendererRoot,
}: {
  apiOrigin: string;
  rendererRoot: string;
}) => {
  protocol.handle("https", async (request) => {
    const url = parseRendererUrl(request.url);
    if (url === null) {
      return await net.fetch(request, { bypassCustomProtocolHandlers: true });
    }
    if (isApiPath(url.pathname, apiPaths)) {
      return await proxy(request, apiOrigin, url.origin);
    }
    const file = rendererFile(url, rendererRoot);
    if (file === null) {
      return notFound();
    }
    const response = await net.fetch(pathToFileURL(file).href);
    const headers = new Headers(response.headers);
    headers.set("content-security-policy", contentSecurityPolicy);
    return new Response(response.body, { headers, status: response.status });
  });
};
