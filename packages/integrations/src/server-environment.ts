import type { Context } from "@vibestart/core";
import { defineSlot } from "@vibestart/core";

import { backendHost } from "#/app-shape.ts";

/** `lazy`: Next.js imports every route during `next build` without runtime variables, so `env.ts` exports `readEnv()`. */
export const serverApp = (ctx: Context) => {
  if (backendHost(ctx.stack) === "standalone") {
    return {
      dir: "apps/server",
      envImport: ctx.has("workers")
        ? 'import { env } from "#src/node-env.ts";'
        : 'import { env } from "#src/env.ts";',
      lazy: false,
      read: (name: string) => `env.${name}`,
      src: "apps/server/src",
    };
  }

  const lazy = ctx.has("next");

  const envImport = ctx.has("workers")
    ? 'import { env } from "#src/server/node-env.ts";'
    : 'import { env } from "#src/server/env.ts";';

  return {
    dir: "apps/web",
    envImport: lazy
      ? 'import { readEnv } from "#src/server/env.ts";'
      : envImport,
    lazy,
    read: (name: string) => (lazy ? `readEnv().${name}` : `env.${name}`),
    src: "apps/web/src/server",
  };
};

export interface EnvVariable {
  name: string;
  schema: string;
  example: string;
}

export const serverEnv = defineSlot<EnvVariable>("app/server-env");

export const renderEnvModule = (
  variables: readonly EnvVariable[],
  lazy: boolean
) => {
  const server = variables
    .toSorted((a, b) => (a.name < b.name ? -1 : 1))
    .map(({ name, schema }) => `${name}: ${schema},`);

  const options = [
    "emptyStringAsUndefined: true,",
    "runtimeEnv: process.env,",
    "server: {",
    ...server.map((line) => `  ${line}`),
    "},",
  ];

  const body = lazy
    ? [
        "export const readEnv = () =>",
        "  createEnv({",
        ...options.map((line) => `    ${line}`),
        "  });",
      ]
    : [
        "export const env = createEnv({",
        ...options.map((line) => `  ${line}`),
        "});",
      ];

  return [
    'import { createEnv } from "@t3-oss/env-core";',
    'import { z } from "zod";',
    "",
    ...body,
    "",
  ].join("\n");
};

export const environmentConvention = (ctx: Context, loading: string) => {
  const { dir, lazy, src } = serverApp(ctx);
  const reads = lazy ? "`readEnv()`" : "`env`";
  const envPath = ctx.has("workers") ? `${dir}/env.ts` : `${src}/env.ts`;

  return {
    text: [
      `Declare every server variable in \`${envPath}\` and list it, with a safe example value, under Environment in \`README.md\`. Keep real values in the ignored \`.env\` file. Code reads ${reads}${ctx.has("workers") ? " from the Worker environment schema" : ""}.`,
      loading,
      ...(ctx.has("sqlite")
        ? [`\`DATABASE_URL\` resolves from the \`${dir}\` directory.`]
        : []),
    ].join(" "),
    title: "Environment",
  };
};
