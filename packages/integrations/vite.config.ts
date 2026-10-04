import { configDefaults, defineConfig } from "vite-plus";

// Templates are generated-project files loaded as raw strings, not source of this package.
const templates = "templates/**";

export default defineConfig({
  oxc: { exclude: [`**/${templates}`] },
  test: {
    // Generating every stack is CPU-bound: seconds on a workstation, a minute or more on a two-core CI runner.
    testTimeout: 180_000,
    // Vitest empties CSS modules it does not process, including `?raw` imports.
    css: { include: [/\/templates\//u] },
    exclude: [...configDefaults.exclude, templates],
  },
});
