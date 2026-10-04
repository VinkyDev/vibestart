import path from "node:path";

import { runnerImport } from "vite-plus";

import type * as Stacks from "../src/stacks.ts";
import config from "../vite.config.ts";

// Through Vite, so the generator's `import.meta.glob` templates, `?raw` imports, and `#/` paths resolve.
// `runnerImport` ignores config files, so the package's config is passed inline.
const { module } = await runnerImport<typeof Stacks>("/src/stacks.ts", {
  ...config,
  root: path.dirname(import.meta.dirname),
});
process.exitCode = await module.main(process.argv.slice(2));
