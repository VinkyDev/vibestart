import { readFile } from "node:fs/promises";
import path from "node:path";

import { defineConfig } from "vite-plus";

const rawQuery = "?raw";

// The integrations load templates with Vite's `?raw` imports, which tsdown does not implement.
const raw = {
  load: async (id: string) =>
    id.endsWith(rawQuery)
      ? `export default ${JSON.stringify(await readFile(id.slice(0, -rawQuery.length), "utf-8"))};`
      : null,
  name: "raw",
  resolveId: (source: string, importer: string | undefined) =>
    source.endsWith(rawQuery) && importer !== undefined
      ? path.resolve(path.dirname(importer), source)
      : null,
};

// As in the integrations' own config: templates are generated-project files loaded as raw strings.
export default defineConfig({
  oxc: { exclude: ["**/templates/**"] },
  pack: {
    entry: ["src/cli.ts"],
    // jsonc-parser's `main` is a UMD build whose `require` calls do not survive bundling.
    inputOptions: { resolve: { mainFields: ["module", "main"] } },
    platform: "node",
    plugins: [raw],
  },
  test: {
    // Generating every stack is CPU-bound: seconds on a workstation, a minute or more on a two-core CI runner.
    testTimeout: 180_000,
    // Vitest empties CSS modules it does not process, including the templates' `?raw` imports.
    css: { include: [/\/templates\//u] },
  },
});
