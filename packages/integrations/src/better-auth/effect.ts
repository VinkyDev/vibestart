import type { Context } from "@vibestart/core";
import { contribute, file, packageJson } from "@vibestart/core";

import { serverEnv, stackHeadline } from "#/app.ts";
import { composeEnv } from "#/docker.ts";
import { quote } from "#/format.ts";
import { replaceOnce, templateContent, templateFiles } from "#/templates.ts";
import { agentsMap, readmeLayers } from "#/vite-plus/slots.ts";

const authIndex = (ctx: Context) => {
  const path = "packages/auth/src/index.ts";

  const set = ctx.has("sqlite")
    ? "better-auth/effect-sqlite"
    : "better-auth/effect-postgres";

  let source = templateContent(ctx, set, path);
  const mobile = ctx.has("expo");

  const trustedOrigins = [
    ...(ctx.has("electron") ? ["rendererOrigin"] : []),
    ...(mobile ? [quote(`${ctx.name}://`)] : []),
  ];

  if (mobile) {
    source = replaceOnce(
      source,
      'import { betterAuth } from "better-auth";',
      'import { expo } from "@better-auth/expo";\nimport { betterAuth } from "better-auth";',
      `${set}/${path}`
    );
  }

  if (ctx.has("electron")) {
    source = replaceOnce(
      source,
      `import * as schema from "${ctx.scope}/db/schema/auth";`,
      `import * as schema from "${ctx.scope}/db/schema/auth";\nimport { rendererOrigin } from "${ctx.scope}/electron";`,
      `${set}/${path}`
    );
  }

  const extraOptions = [
    ...(mobile
      ? [
          "    // The mobile app sends its scheme as the origin; the plugin also trusts exp:// when NODE_ENV is development.",
          "    plugins: [expo()],",
        ]
      : []),
    ...(trustedOrigins.length === 0
      ? []
      : [`    trustedOrigins: [${trustedOrigins.join(", ")}],`]),
  ];

  if (extraOptions.length > 0) {
    source = replaceOnce(
      source,
      "    secret: Redacted.value(options.secret),",
      ["    secret: Redacted.value(options.secret),", ...extraOptions].join(
        "\n"
      ),
      `${set}/${path}`
    );
  }

  return file(path, source);
};

export const effectAuth = (ctx: Context) => [
  ...templateFiles(ctx, "better-auth/common"),
  ...templateFiles(ctx, "better-auth/spa"),
  ...templateFiles(ctx, "better-auth/tanstack-router", {
    except: [
      "apps/web/src/components/auth-form.tsx",
      "apps/web/src/components/user-menu.tsx",
    ],
  }),
  ...templateFiles(ctx, "better-auth/effect"),
  authIndex(ctx),
  contribute(packageJson, {
    dependencies: [
      "@better-auth/drizzle-adapter",
      ...(ctx.has("expo") ? ["@better-auth/expo"] : []),
      `${ctx.scope}/db`,
      "better-auth",
      "drizzle-orm",
      "effect",
      ...(ctx.has("postgres") ? ["postgres"] : []),
    ],
    devDependencies: [`${ctx.scope}/config`, "@types/node", "typescript"],
    imports: {
      "#src/*": "./src/*",
    },
    exports: {
      ".": "./src/index.ts",
    },
    path: "packages/auth",
  }),
  contribute(packageJson, {
    path: "apps/web",
    dependencies: ["better-auth", "sonner"],
  }),
  contribute(serverEnv, {
    name: "BETTER_AUTH_URL",
    example: "http://localhost:5173",
    schema: "Config.string",
  }),
  contribute(serverEnv, {
    name: "BETTER_AUTH_SECRET",
    example: "",
    schema: "Config.Redacted",
  }),
  // Expo Go from the app stores may send exp:// as the origin, which the Expo plugin trusts only
  // in development. `node --watch` does not set NODE_ENV.
  ...(ctx.has("expo")
    ? [
        contribute(serverEnv, {
          name: "NODE_ENV",
          example: "development",
          schema: "Config.String",
        }),
      ]
    : []),
  contribute(composeEnv, {
    name: "BETTER_AUTH_URL",
    value: `\${BETTER_AUTH_URL:-http://localhost:3000}`,
  }),
  contribute(composeEnv, {
    name: "BETTER_AUTH_SECRET",
    value: `\${BETTER_AUTH_SECRET:?set BETTER_AUTH_SECRET}`,
  }),
  contribute(agentsMap, {
    path: "packages/auth",
    owns: "The Auth service: Better Auth configured from Config on its official Promise adapter",
  }),
  contribute(stackHeadline, "Better Auth"),
  contribute(readmeLayers, {
    layer: "Auth",
    choice: `Better Auth with an Effect service boundary and ${ctx.has("sqlite") ? "SQLite" : "PostgreSQL"} sessions`,
  }),
];
