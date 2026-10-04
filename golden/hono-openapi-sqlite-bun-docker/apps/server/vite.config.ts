import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    copy: [{ from: "../../packages/db/src/migrations", to: "dist" }],
    deps: { alwaysBundle: [/^(?!bun(?:$|:))/u], neverBundle: [/^bun(?:$|:)/u] },
    entry: ["src/index.ts", "src/migrate.ts"],
  },
});
