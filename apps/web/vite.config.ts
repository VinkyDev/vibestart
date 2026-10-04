import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import mdx from "fumadocs-mdx/vite";
import { defineConfig } from "vite-plus";

import { vibestart } from "./plugin/index.ts";
import * as docsConfig from "./source.config.ts";

export default defineConfig({
  plugins: [
    paraglideVitePlugin({
      emitGitIgnore: false,
      emitPrettierIgnore: false,
      emitReadme: false,
      emitTsDeclarations: true,
      outdir: `${import.meta.dirname}/src/paraglide`,
      // The output is checked in so `vp check` runs without a build, so dev and build must emit the same
      // structure. At this message count, one module per locale costs less than one directory per message.
      outputStructure: "locale-modules",
      project: `${import.meta.dirname}/project.inlang`,
      strategy: ["localStorage", "preferredLanguage", "baseLocale"],
    }),
    vibestart(),
    // Only the index the app imports: the pages and their frontmatter, with bodies loaded on demand.
    mdx(docsConfig, { index: { browser: false, dynamic: false } }),
    tanstackRouter({ autoCodeSplitting: true, target: "react" }),
    react({ compiler: true }),
    tailwindcss(),
  ],
  test: {
    name: "web",
    testTimeout: 180_000,
  },
});
