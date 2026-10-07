import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import type { Context } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import { auth } from "#src/context.ts";
import { openApi, rpc } from "#src/orpc.ts";

const publicDir = fileURLToPath(new URL("public", import.meta.url));

const authHandler = async (c: Context) => await auth.handler(c.req.raw);

export const app = new Hono()
  .use(logger())
  .use(secureHeaders())
  .on(["GET", "POST"], "/api/auth/*", authHandler)
  .all("/rpc/*", rpc)
  .all("/api/*", openApi);

if (existsSync(publicDir)) {
  app
    .use(serveStatic({ root: publicDir }))
    .get("*", serveStatic({ root: publicDir, path: "index.html" }));
}
