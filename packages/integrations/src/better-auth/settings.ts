import type { Context } from "@vibestart/core";
import { contribute } from "@vibestart/core";

import { composeEnv } from "#/docker/slots.ts";
import { quote } from "#/format.ts";
import { devOrigin } from "#/server-address.ts";
import { serverEnv } from "#/server-environment.ts";

export const trustedOrigins = (ctx: Context) => [
  ...(ctx.has("electron") ? ["rendererOrigin"] : []),
  ...(ctx.has("expo") ? [quote(`${ctx.name}://`)] : []),
];

export const authEnvironment = (ctx: Context) => {
  const effect = ctx.has("effect");

  return [
    contribute(serverEnv, {
      name: "BETTER_AUTH_URL",
      example: devOrigin(ctx.stack),
      schema: effect ? "Config.string" : "z.url()",
    }),
    contribute(serverEnv, {
      name: "BETTER_AUTH_SECRET",
      example: "",
      schema: effect ? "Config.Redacted" : "z.string().min(32)",
    }),
    // Expo Go's exp:// origin needs development mode; Node's watcher does not set NODE_ENV.
    ...(ctx.has("expo") && (effect || ctx.has("hono"))
      ? [
          contribute(serverEnv, {
            name: "NODE_ENV",
            example: "development",
            schema: effect
              ? "Config.String"
              : 'z.enum(["development", "production", "test"]).optional()',
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
  ];
};
