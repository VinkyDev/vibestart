import { once } from "node:events";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

import { app } from "#src/app.ts";
import { db } from "#src/context.ts";
import { env } from "#src/env.ts";

const publicDir = fileURLToPath(new URL("public", import.meta.url));

if (existsSync(publicDir)) {
  app
    .use(serveStatic({ root: publicDir }))
    .get("*", serveStatic({ root: publicDir, path: "index.html" }));
}

const server = serve({ fetch: app.fetch, port: env.PORT }, ({ port }) => {
  console.log(`Server listening on http://localhost:${port}`);
});

await Promise.race([once(process, "SIGINT"), once(process, "SIGTERM")]);

server.close();

await once(server, "close");

await db.$client.end();
