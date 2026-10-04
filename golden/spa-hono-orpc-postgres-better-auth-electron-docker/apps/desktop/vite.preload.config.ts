import path from "node:path";

import { defineConfig } from "vite-plus";

export default defineConfig({
  build: {
    lib: {
      entry: path.join(import.meta.dirname, "src/preload/index.ts"),
      fileName: () => "index.cjs",
      formats: ["cjs"],
    },
    outDir: "dist/preload",
    rolldownOptions: { external: ["electron"] },
    ssr: true,
    target: "node22",
  },
  publicDir: false,
  // A sandboxed preload cannot `require()` npm packages, so it bundles everything but `electron`.
  ssr: { noExternal: true },
});
