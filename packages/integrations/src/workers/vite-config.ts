import type { Context } from "@vibestart/core";

import { devServer } from "#/server-address.ts";

export const authSecrets = ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"];

export const workerViteConfig = (ctx: Context) => {
  const start = ctx.has("tanstack-start");
  const database = ctx.stack.database !== undefined;
  const auth = ctx.has("better-auth");

  return [
    'import { cloudflare } from "@cloudflare/vite-plugin";',
    ...(start
      ? [
          'import tailwindcss from "@tailwindcss/vite";',
          'import { tanstackStart } from "@tanstack/react-start/plugin/vite";',
          'import react from "@vitejs/plugin-react";',
        ]
      : []),
    `import { defineConfig${database ? ", loadEnv" : ""} } from "vite-plus";`,
    "",
    ...(database
      ? [
          "export default defineConfig(({ command, mode }) => {",
          "  // Build artifacts must not include the local database URL or auth secret.",
          '  process.env.CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV = String(command === "serve");',
          "",
          '  if (command === "serve") {',
          '    const local = loadEnv(mode, import.meta.dirname, "");',
          "",
          "    if (local.DATABASE_URL !== undefined) {",
          "      process.env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE = local.DATABASE_URL;",
          "    }",
          ...(auth
            ? [
                "",
                `    for (const name of ${JSON.stringify(authSecrets)}) {`,
                "      const value = local[name];",
                "",
                "      if (value !== undefined) {",
                "        process.env[name] = value;",
                "      }",
                "    }",
              ]
            : []),
          "  }",
          "",
          "  return {",
        ]
      : ["export default defineConfig({"]),
    "    plugins: [",
    '      cloudflare({ inspectorPort: false, viteEnvironment: { name: "ssr" } }),',
    ...(start
      ? [
          "      tailwindcss(),",
          "      tanstackStart(),",
          "      react({ compiler: true }),",
        ]
      : []),
    "    ],",
    ...(start ? [] : ['    publicDir: "../web/dist",']),
    `    server: { port: ${devServer(ctx.stack).port} },`,
    ...(database ? ["  };"] : []),
    "});",
    "",
  ].join("\n");
};
