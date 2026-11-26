import type { Context } from "@vibestart/core";
import { contribute, file, packageJson } from "@vibestart/core";

import { authEnvironment, trustedOrigins } from "#/better-auth/settings.ts";
import { stackHeadline } from "#/stack-headline.ts";
import { replaceOnce, templateContent, templateFiles } from "#/templates.ts";
import { agentsMap, readmeLayers } from "#/vite-plus/slots.ts";

const authIndex = (ctx: Context) => {
  const path = "packages/auth/src/index.ts";

  const set = ctx.has("sqlite")
    ? "better-auth/effect-sqlite"
    : "better-auth/effect-postgres";

  let source = templateContent(ctx, set, path);
  const mobile = ctx.has("expo");

  const origins = trustedOrigins(ctx);

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
    ...(origins.length === 0
      ? []
      : [`    trustedOrigins: [${origins.join(", ")}],`]),
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

export const effectAuthPages = (ctx: Context) => [
  ...templateFiles(ctx, "better-auth/spa"),
  ...templateFiles(ctx, "better-auth/tanstack-router", {
    except: [
      "apps/web/src/components/auth-form.tsx",
      "apps/web/src/components/user-menu.tsx",
    ],
  }),
  ...templateFiles(ctx, "better-auth/web"),
  ...templateFiles(ctx, "better-auth/effect"),
];

export const effectAuth = (ctx: Context) => [
  ...templateFiles(ctx, "better-auth/common"),
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
    exports: {
      ".": "./src/index.ts",
    },
    path: "packages/auth",
  }),
  contribute(packageJson, {
    path: "apps/web",
    dependencies: ctx.has("solid")
      ? ["better-auth"]
      : ["better-auth", "sonner"],
  }),
  ...authEnvironment(ctx),
  contribute(agentsMap, {
    path: "packages/auth",
    owns: "The Auth service: Better Auth configured from Config on its official Promise adapter",
  }),
  contribute(stackHeadline, { name: "Better Auth", role: "Auth" }),
  contribute(readmeLayers, {
    layer: "Auth",
    choice: `Better Auth with an Effect service boundary and ${ctx.has("sqlite") ? "SQLite" : "PostgreSQL"} sessions`,
  }),
];
