import type { Context } from "@vibestart/core";
import { defineSlot, file, renderFile } from "@vibestart/core";

import { templateContent, templateFiles } from "#/templates.ts";

export const authVariant = (ctx: Context) =>
  ctx.has("better-auth") ? "auth" : "public";

/** The SQL database of a stack that has one: SQLite is a file beside the app; PostgreSQL and MySQL are servers. */
export const sqlDatabase = (ctx: Context) => {
  if (ctx.has("mysql")) {
    return { id: "mysql", name: "MySQL", server: true } as const;
  }

  if (ctx.has("postgres")) {
    return { id: "postgres", name: "PostgreSQL", server: true } as const;
  }

  return { id: "sqlite", name: "SQLite", server: false } as const;
};

/** The database kind's choice: SQLite is a file beside the app; the others are servers. */
export const chosenDatabase = (ctx: Context) =>
  ctx.has("mongodb")
    ? ({ id: "mongodb", name: "MongoDB", server: true } as const)
    : sqlDatabase(ctx);

export const databaseName = (ctx: Context) => chosenDatabase(ctx).name;

export const hasWebApp = (ctx: Context) => ctx.stack.framework !== undefined;

/** `lazy`: Next.js imports every route during `next build` without runtime variables, so `env.ts` exports `readEnv()`. */
export const serverApp = (ctx: Context) => {
  if (ctx.has("hono")) {
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
      // Each statement stands apart, as Ultracite's readable-spacing rule asks.
      ...(ctx.has("workers")
        ? [
            "",
            "try {",
            ...run.slice(0, -1).map((statement) => `  ${statement}`),
            "} finally {",
            `  ${run.at(-1)}`,
            "}",
          ]
        : run.flatMap((statement) => ["", statement])),
      "",
    ].join("\n")
  );
};

const migrationCopy =
  '    copy: [{ from: "../../packages/db/src/migrations", to: "dist" }],\n';

/** A `vp pack` config bundling the migration entry: it copies the SQL migrations, which MongoDB does not have. */
export const packConfig = (ctx: Context, path: string, content: string) => {
  if (!content.includes(migrationCopy)) {
    throw new Error(`${path} does not copy the migrations`);
  }

  return ctx.has("mongodb") ? content.replace(migrationCopy, "") : content;
};

export const environmentConvention = (ctx: Context, loading: string) => {
  const { dir, lazy, src } = serverApp(ctx);
  const reads = lazy ? "`readEnv()`" : "`env`";
  const envPath = ctx.has("workers") ? `${dir}/env.ts` : `${src}/env.ts`;

  return {
    text: [
      `Declare every server variable in \`${envPath}\` and list it, with a safe example value, under Environment in \`README.md\`. Keep real values in the ignored \`.env\` file. Code reads ${reads}${ctx.has("workers") ? " from `void/env`" : ""}.`,
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

const orms = [
  { id: "prisma", name: "Prisma", release: "Prisma ORM 7" },
  { id: "mongoose", name: "Mongoose", release: "Mongoose 9" },
] as const;

const drizzleOrm = {
  id: "drizzle",
  name: "Drizzle",
  release: "Drizzle ORM v1",
} as const;

const ormOf = (ctx: Context) =>
  orms.find(({ id }) => ctx.has(id)) ?? drizzleOrm;

export const ormId = (ctx: Context) => ormOf(ctx).id;

/** The packages a module needs to query through the ORM beside the `db` package: Drizzle's operators. */
export const ormDependencies = (ctx: Context) =>
  ormId(ctx) === "drizzle" ? ["drizzle-orm"] : [];

// The todos module written for Drizzle on PostgreSQL and SQLite, or the set that replaces it.
const todosModule = (ctx: Context) => {
  if (ctx.has("prisma") || ctx.has("mongoose")) {
    return `${ormId(ctx)}-${authVariant(ctx)}`;
  }

  // MySQL has no `returning`, so Drizzle reads a row back after each write.
  return ctx.has("mysql") ? `drizzle-mysql-${authVariant(ctx)}` : undefined;
};

/** The API's template set, with the todos module at `todos` written for the stack's ORM and database. */
export const apiTemplates = (ctx: Context, set: string, todos: string) => {
  const module = todosExample(ctx) ? todosModule(ctx) : undefined;

  return module === undefined
    ? templateFiles(ctx, `${set}/${apiVariant(ctx)}`)
    : [
        ...templateFiles(ctx, `${set}/${apiVariant(ctx)}`, { except: [todos] }),
        ...templateFiles(ctx, `${set}/${module}`),
      ];
};

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

/** The ORM as the README's layers table names it, with its major version. */
export const ormRelease = (ctx: Context) => ormOf(ctx).release;

export const databaseFlow = (ctx: Context) =>
  ctx.stack.database === undefined
    ? ""
    : ` → ${ormOf(ctx).name} → ${databaseName(ctx)}`;

/**
 * A `select 1` through the ORM, for a health check: the statement, whether it awaits, the imports it needs, and
 * the packages those come from.
 */
export const databaseCheck = (ctx: Context, db: string) => {
  if (ctx.has("mongoose")) {
    return {
      async: true,
      dependencies: [],
      imports: [],
      statement: `await ${db}.connection.getClient().db().command({ ping: 1 });`,
    };
  }

  if (ctx.has("prisma")) {
    return {
      async: true,
      dependencies: [],
      imports: [],
      statement: `await ${db}.$queryRaw\`select 1\`;`,
    };
  }

  const drizzle = {
    dependencies: ["drizzle-orm"],
    imports: ['import { sql } from "drizzle-orm";'],
  };

  return ctx.has("sqlite")
    ? { ...drizzle, async: false, statement: `${db}.run(sql\`select 1\`);` }
    : {
        ...drizzle,
        async: true,
        statement: `await ${db}.execute(sql\`select 1\`);`,
      };
};

/** The import block of a generated module: the imports, then a blank line, or nothing. */
export const importBlock = (imports: readonly string[]) =>
  imports.length === 0 ? [] : [...imports, ""];

/** The statement that closes `db` once a script is done with it. */
export const closeDatabase = (ctx: Context, db = "db") => {
  if (ctx.has("mongoose")) {
    return `await ${db}.connection.close();`;
  }

  if (ctx.has("prisma")) {
    return `await ${db}.$disconnect();`;
  }

  if (ctx.has("sqlite")) {
    return `${db}.$client.close();`;
  }

  return ctx.has("mysql")
    ? `await ${db}.$client.promise().end();`
    : `await ${db}.$client.end();`;
};

export const selfHealthRoute = (ctx: Context) => {
  const next = ctx.has("next");

  const check = databaseCheck(
    ctx,
    next || ctx.has("workers") ? "getServices().db" : "db"
  );

  const handler = [
    `${check.async ? "async " : ""}() => {`,
    `  ${check.statement}`,
    "",
    '  return Response.json({ status: "ok" });',
    "};",
  ];

  if (next) {
    return file(
      "apps/web/src/app/api/health/route.ts",
      [
        ...importBlock(check.imports),
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
      ...check.imports,
      "",
      ctx.has("workers")
        ? 'import { getServices } from "#src/server/context.ts";'
        : 'import { db } from "#src/server/context.ts";',
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

/** The stack's names as one English list: "A, B and C". */
export const listStack = (names: readonly string[]) =>
  names.length > 1
    ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`
    : names.join("");

/** `route` wraps the page in a TanStack file route. */
export const homePage = (ctx: Context, path: string, route: boolean) =>
  renderFile(path, (read) => {
    const listed = listStack(read(stackHeadline));

    const status = hasBackend(ctx);

    return [
      ...(route
        ? ['import { createFileRoute } from "@tanstack/react-router";', ""]
        : []),
      ...(status
        ? ['import { ApiStatus } from "#src/components/api-status.tsx";', ""]
        : []),
      "const HomePage = () => (",
      '  <section className="grid gap-10 sm:py-8">',
      '    <div className="grid gap-5">',
      ...(status
        ? [
            '      <div className="text-muted-foreground flex items-center gap-2 text-sm">',
            "        API",
            "        <ApiStatus />",
            "      </div>",
          ]
        : []),
      '      <h1 className="text-5xl font-semibold tracking-tighter text-balance break-words sm:text-7xl">',
      `        ${ctx.name}`,
      "      </h1>",
      '      <p className="text-muted-foreground max-w-xl text-lg text-pretty">',
      `        ${listed} on Vite+.`,
      "      </p>",
      "    </div>",
      '    <p className="text-muted-foreground border-t pt-6 text-sm">',
      `      Edit <code className="text-foreground font-mono">${path}</code> and save to see it change.`,
      "    </p>",
      "  </section>",
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
