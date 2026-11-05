import { fileURLToPath } from "node:url";

import { resolveConfig } from "vite";

// Router and Start write route types in configResolved, before Vite bundles the app.
await resolveConfig(
  { root: fileURLToPath(new URL("../apps/web", import.meta.url)) },
  "build"
);
