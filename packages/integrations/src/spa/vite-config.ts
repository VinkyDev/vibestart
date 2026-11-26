import type { Context } from "@vibestart/core";
import { file } from "@vibestart/core";

import { serverPaths } from "#/request-paths.ts";
import { devServer } from "#/server-address.ts";

const reactPlugins = `plugins: [
  tanstackRouter({ target: "react", autoCodeSplitting: true }),
  react({ compiler: true }),
  tailwindcss(),
]`;

export const viteConfig = (ctx: Context) => {
  const paths = serverPaths(ctx).toSorted();

  const solid = ctx.has("solid");
  const plugins = solid ? "plugins: [solid(), tailwindcss()]" : reactPlugins;

  const imports = [
    ...(solid ? ['import solid from "@solidjs/vite-plugin";'] : []),
    'import tailwindcss from "@tailwindcss/vite";',
    ...(solid
      ? []
      : [
          'import { tanstackRouter } from "@tanstack/router-plugin/vite";',
          'import react from "@vitejs/plugin-react";',
        ]),
  ];

  const config =
    paths.length === 0
      ? `{
  ${plugins},
}`
      : `({ mode }) => {
    const { SERVER_URL = "${devServer(ctx.stack).origin}" } = loadEnv(mode, import.meta.dirname, "");

    return {
      ${plugins},
      server: { proxy: {
        ${paths.map((path) => `"${path}": SERVER_URL,`).join("\n")}
      } },
    };
  }`;

  return file(
    "apps/web/vite.config.ts",
    `${imports.join("\n")}
import { defineConfig${paths.length === 0 ? "" : ", loadEnv"} } from "vite-plus";

export default defineConfig(${config});
`
  );
};
