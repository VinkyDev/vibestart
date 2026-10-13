import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    deps: { alwaysBundle: [/./u] },
    entry: ["src/index.ts", "src/migrate.ts"],
  },
});
