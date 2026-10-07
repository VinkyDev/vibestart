import { once } from "node:events";

import { e2eBaseURL, startTestServer } from "./server.ts";

const stopped = Promise.race([
  once(process, "SIGINT"),
  once(process, "SIGTERM"),
]);
const stop = await startTestServer(e2eBaseURL);
try {
  await stopped;
} finally {
  await stop();
}
