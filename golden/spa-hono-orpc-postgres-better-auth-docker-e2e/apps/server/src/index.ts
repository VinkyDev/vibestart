import { once } from "node:events";

import { serve } from "@hono/node-server";

import { app } from "#src/app.ts";
import { db } from "#src/context.ts";
import { env } from "#src/env.ts";

const server = serve({ fetch: app.fetch, port: env.PORT }, ({ port }) => {
  console.log(`Server listening on http://localhost:${port}`);
});

await Promise.race([once(process, "SIGINT"), once(process, "SIGTERM")]);
server.close();
await once(server, "close");
await db.$client.end();
