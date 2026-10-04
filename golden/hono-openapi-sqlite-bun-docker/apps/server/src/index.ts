import { once } from "node:events";

import { serve } from "bun";

import { app } from "#src/app.ts";
import { db } from "#src/context.ts";
import { env } from "#src/env.ts";

const server = serve({ fetch: app.fetch, port: env.PORT });
const { port } = server;
console.log(`Server listening on http://localhost:${port}`);

await Promise.race([once(process, "SIGINT"), once(process, "SIGTERM")]);
await server.stop();
db.$client.close();
