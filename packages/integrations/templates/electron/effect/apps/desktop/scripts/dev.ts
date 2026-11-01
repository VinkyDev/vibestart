import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

import { Effect, Schedule, Schema } from "effect";

const rendererUrl = "http://localhost:5173/";

const electron = Schema.decodeUnknownSync(Schema.String)(
  createRequire(import.meta.url)("electron")
);

const waitForRenderer = Effect.tryPromise({
  try: async (signal) => await fetch(rendererUrl, { signal }),
  catch: () =>
    new Error(
      `Nothing answered at ${rendererUrl}. Is the web dev server running on port 5173?`
    ),
}).pipe(
  Effect.retry({
    schedule: Schedule.spaced("200 millis"),
    times: 300,
  })
);

await Effect.runPromise(waitForRenderer);

const app = spawn(electron, ["."], {
  cwd: path.join(import.meta.dirname, ".."),
  env: { ...process.env, ELECTRON_RENDERER_URL: rendererUrl },
  stdio: "inherit",
});

const stop = () => {
  app.kill();
};

process.on("SIGINT", stop);

process.on("SIGTERM", stop);

app.on("exit", (code) => process.exit(code ?? 0));
