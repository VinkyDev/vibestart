import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

import { retry } from "es-toolkit/function";
import { z } from "zod";

const rendererUrl = "http://localhost:5173/";

const electron = z.string().parse(createRequire(import.meta.url)("electron"));

// Any answer counts: something is serving the port.
const isUp = async () => {
  try {
    await fetch(rendererUrl);
    return true;
  } catch {
    return false;
  }
};

await retry(
  async () => {
    if (!(await isUp())) {
      throw new Error(
        `Nothing answered at ${rendererUrl}. Is the web dev server running on port 5173?`
      );
    }
  },
  { delay: 200, retries: 300 }
);

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
