import type { Context } from "@vibestart/core";
import { defineSlot, file, renderFile } from "@vibestart/core";

import { templateContent } from "#/templates.ts";

export const authVariant = (ctx: Context) =>
  ctx.has("better-auth") ? "auth" : "public";

export const databaseName = (ctx: Context) =>
  ctx.has("sqlite") ? "SQLite" : "PostgreSQL";

export const hasWebApp = (ctx: Context) => ctx.stack.framework !== undefined;

/** `lazy`: Next.js imports every route during `next build` without runtime variables, so `env.ts` exports `readEnv()`. */
export const serverApp = (ctx: Context) => {
  if (ctx.has("hono")) {
    return {
      dir: "apps/server",
      envImport: 'import { env } from "#src/env.ts";',
      lazy: false,
      read: (name: string) => `env.${name}`,
      src: "apps/server/src",
    };
  }
  const lazy = ctx.has("next");
  return {
    dir: "apps/web",
    envImport: lazy
      ? 'import { readEnv } from "#src/server/env.ts";'
      : 'import { env } from "#src/server/env.ts";',
    lazy,
    read: (name: string) => (lazy ? `readEnv().${name}` : `env.${name}`),
    src: "apps/web/src/server",
  };
};

export const devOrigin = (ctx: Context) =>
  ctx.has("spa") ? "http://localhost:5173" : "http://localhost:3000";

export interface EnvVariable {
  name: string;
  schema: string;
  example: string;
}

export const serverEnv = defineSlot<EnvVariable>("app/server-env");

export const stackHeadline = defineSlot<string>("app/stack-headline");

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

export const renderEnvExample = (variables: readonly EnvVariable[]) =>
  variables.map(({ name, example }) => `${name}=${example}\n`).join("");

/** `run` migrates and closes `db`, in the driver's sync or async form. */
export const migrationEntry = (ctx: Context, run: readonly string[]) => {
  const { envImport, read, src } = serverApp(ctx);
  return file(
    `${src}/migrate.ts`,
    [
      `import { createDb } from "${ctx.scope}/db";`,
      `import { migrateDatabase } from "${ctx.scope}/db/migrate";`,
      "",
      envImport,
      "",
      `const db = createDb(${read("DATABASE_URL")});`,
      ...run,
      "",
    ].join("\n")
  );
};

export const environmentConvention = (ctx: Context, loading: string) => {
  const { dir, lazy, src } = serverApp(ctx);
  const reads = lazy ? "`readEnv()`" : "`env`";
  return {
    text: [
      `Declare every server variable in \`${src}/env.ts\` and add it to \`${dir}/.env.example\`. Code reads ${reads}.`,
      loading,
      ...(ctx.has("sqlite")
        ? [`\`DATABASE_URL\` resolves from the \`${dir}\` directory.`]
        : []),
    ].join(" "),
    title: "Environment",
  };
};

export const hasBackend = (ctx: Context) => ctx.stack.backend !== undefined;

export const proxiesToHono = (ctx: Context) =>
  ctx.has("hono") && hasWebApp(ctx) && !ctx.has("spa");

export const serverUrl: EnvVariable = {
  example: "http://localhost:3001",
  name: "SERVER_URL",
  schema: 'z.url().default("http://localhost:3001")',
};

export const apiVariant = (ctx: Context) =>
  ctx.stack.database === undefined ? "stateless" : authVariant(ctx);

export const todosExample = (ctx: Context) =>
  ctx.stack.api !== undefined && ctx.stack.database !== undefined;

/** `auth` adds accounts to the todos; `account` is accounts alone; `none` has no data. */
export const exampleVariant = (ctx: Context) => {
  if (todosExample(ctx)) {
    return authVariant(ctx);
  }
  return ctx.has("better-auth") ? "account" : "none";
};

export const webMigrates = (ctx: Context) =>
  ctx.has("self") && ctx.stack.database !== undefined;

export const hasTables = (ctx: Context) =>
  todosExample(ctx) || ctx.has("better-auth");

export const databaseFlow = (ctx: Context) =>
  ctx.stack.database === undefined ? "" : ` → Drizzle → ${databaseName(ctx)}`;

export const databaseCheck = (ctx: Context, db: string) =>
  ctx.has("sqlite")
    ? { async: false, statement: `${db}.run(sql\`select 1\`);` }
    : { async: true, statement: `await ${db}.execute(sql\`select 1\`);` };

export const selfHealthRoute = (ctx: Context) => {
  const next = ctx.has("next");
  const check = databaseCheck(ctx, next ? "getServices().db" : "db");
  const handler = [
    `${check.async ? "async " : ""}() => {`,
    `  ${check.statement}`,
    '  return Response.json({ status: "ok" });',
    "};",
  ];
  if (next) {
    return file(
      "apps/web/src/app/api/health/route.ts",
      [
        'import { sql } from "drizzle-orm";',
        "",
        'import { getServices } from "#src/server/context.ts";',
        "",
        `export const GET = ${handler.join("\n")}`,
        "",
      ].join("\n")
    );
  }
  return file(
    "apps/web/src/routes/api/health.ts",
    [
      'import { createFileRoute } from "@tanstack/react-router";',
      'import { sql } from "drizzle-orm";',
      "",
      'import { db } from "#src/server/context.ts";',
      "",
      `const health = ${handler.join("\n")}`,
      "",
      'export const Route = createFileRoute("/api/health")({',
      "  server: { handlers: { GET: health } },",
      "});",
      "",
    ].join("\n")
  );
};

export const clientComponent = (ctx: Context, content: string) =>
  ctx.has("next") ? `"use client";\n\n${content}` : content;

/** `route` wraps the page in a TanStack file route. */
export const homePage = (ctx: Context, path: string, route: boolean) =>
  renderFile(path, (read) => {
    const names = read(stackHeadline);
    const listed =
      names.length > 1
        ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
        : names.join("");
    const status = hasBackend(ctx);
    const cardParts = [
      "Card",
      ...(status ? ["CardContent"] : []),
      "CardDescription",
      "CardHeader",
      "CardTitle",
    ];
    return [
      ...(route
        ? ['import { createFileRoute } from "@tanstack/react-router";', ""]
        : []),
      `import { ${cardParts.join(", ")} } from "${ctx.scope}/ui/components/card";`,
      "",
      ...(status
        ? ['import { ApiStatus } from "#src/components/api-status.tsx";', ""]
        : []),
      "const HomePage = () => (",
      "  <Card>",
      "    <CardHeader>",
      `      <CardTitle>${ctx.name}</CardTitle>`,
      `      <CardDescription>${listed} on Vite+.</CardDescription>`,
      "    </CardHeader>",
      ...(status
        ? [
            '    <CardContent className="flex items-center justify-between">',
            "      <span>API status</span>",
            "      <ApiStatus />",
            "    </CardContent>",
          ]
        : []),
      "  </Card>",
      ");",
      "",
      ...(route
        ? [
            'export const Route = createFileRoute("/")({',
            "  component: HomePage,",
            "});",
          ]
        : ["export default HomePage;"]),
      "",
    ].join("\n");
  });

const linksPattern =
  /^const links = \[\n(?<entries>(?: {2}.*,\n)+)\] as const;$/mu;

export const navigation = (ctx: Context, set: string, path: string) => {
  const content = templateContent(ctx, set, path);
  const entries = linksPattern.exec(content)?.groups?.entries;
  if (entries === undefined) {
    throw new Error(`${set}/${path} has no links array`);
  }
  const links = entries
    .trimEnd()
    .split("\n")
    .map((line) => line.trim().slice(0, -1))
    .filter((link) => todosExample(ctx) || !link.includes('"/todos"'));
  return file(
    path,
    content.replace(
      linksPattern,
      `const links = [${links.join(", ")}] as const;`
    )
  );
};
