import type { Context, ReadSlot } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
  pnpmWorkspace,
  renderFile,
  setupCommand,
} from "@vibestart/core";

import {
  closeDatabase,
  hasBackend,
  renderEnvModule,
  serverEnv,
} from "#/app.ts";
import { knipEntries } from "#/knip.ts";
import {
  agentsConventions,
  agentsMap,
  generatedFiles,
  ignoredFiles,
  readmeLayers,
  readmeSections,
  readmeTagline,
  rootTypeScriptFiles,
} from "#/vite-plus/slots.ts";

const workerApp = (ctx: Context) =>
  ctx.has("hono") ? "apps/server" : "apps/web";

/** Workers own a client per request; the stream owns it after the handler returns. */
export const workerServices = (ctx: Context) => {
  const start = ctx.has("tanstack-start");
  const auth = ctx.has("better-auth");
  const close = closeDatabase(ctx);

  return [
    ...(start
      ? ['import { getRequest } from "@tanstack/react-start/server";']
      : []),
    'import { env as bindings, waitUntil } from "cloudflare:workers";',
    'import { env } from "void/env";',
    "",
    ...(auth
      ? [
          `import { createAuth } from "${ctx.scope}/auth";`,
          `import type { Auth } from "${ctx.scope}/auth";`,
        ]
      : []),
    `import { createDb } from "${ctx.scope}/db";`,
    `import type { Database } from "${ctx.scope}/db";`,
    "",
    `${start ? "" : "export "}interface Services {`,
    ...(auth ? ["  auth: Auth;"] : []),
    "  db: Database;",
    "}",
    "",
    ...(start
      ? [
          "const requests = new WeakMap<Request, Services>();",
          "",
          "export const getServices = () => {",
          "  const services = requests.get(getRequest());",
          "",
          "  if (services === undefined) {",
          '    throw new Error("Services require the request wrapper in src/server.ts");',
          "  }",
          "",
          "  return services;",
          "};",
          "",
        ]
      : []),
    "export const withServices = async (",
    ...(start ? ["  request: Request,"] : []),
    "  handle: (services: Services) => Promise<Response>",
    ") => {",
    "  const db = createDb(env.DATABASE_URL ?? bindings.HYPERDRIVE.connectionString);",
    "  let streaming = false;",
    "",
    "  const dispose = async () => {",
    ...(start ? ["    requests.delete(request);"] : []),
    `    ${close}`,
    "  };",
    "",
    "  try {",
    "    const services = {",
    ...(auth
      ? [
          "      auth: createAuth({",
          "        baseURL: env.BETTER_AUTH_URL,",
          "        db,",
          "        secret: env.BETTER_AUTH_SECRET,",
          "      }),",
        ]
      : []),
    "      db,",
    "    };",
    ...(start ? ["", "    requests.set(request, services);"] : []),
    "",
    "    const response = await handle(services);",
    "",
    "    if (response.body === null) {",
    "      return response;",
    "    }",
    "",
    "    const { readable, writable } = new TransformStream<Uint8Array>();",
    "    const forwarded = new Response(readable, response);",
    "    const completed = response.body.pipeTo(writable).finally(dispose);",
    "    streaming = true;",
    "    waitUntil(completed);",
    "",
    "    return forwarded;",
    "  } finally {",
    "    if (!streaming) {",
    "      await dispose();",
    "    }",
    "  }",
    "};",
    "",
  ].join("\n");
};

export const workerTsconfig = (ctx: Context) => {
  const dir = workerApp(ctx);
  const start = ctx.has("tanstack-start");
  const nodeEnv = start ? "src/server/node-env.ts" : "src/node-env.ts";
  const migrate = start ? "src/server/migrate.ts" : "src/migrate.ts";

  return [
    file(
      `${dir}/tsconfig.json`,
      JSON.stringify({
        files: [],
        references: [
          { path: "./tsconfig.worker.json" },
          { path: "./tsconfig.node.json" },
        ],
      })
    ),
    file(
      `${dir}/tsconfig.worker.json`,
      JSON.stringify({
        extends: `${ctx.scope}/config/typescript/${start ? "react" : "base"}.json`,
        compilerOptions: {
          types: ["void/env", ...(start ? ["vite/client"] : [])],
          jsx: start ? "react-jsx" : undefined,
        },
        include: [
          "src",
          ...(ctx.has("hono") ? ["routes"] : []),
          "env.ts",
          "worker-env.d.ts",
          ".void/*.d.ts",
        ],
        exclude: [migrate, nodeEnv, "src/**/*.test.ts"],
      })
    ),
    file(
      `${dir}/tsconfig.node.json`,
      JSON.stringify({
        extends: `${ctx.scope}/config/typescript/node.json`,
        include: [
          "*.config.ts",
          "config/**/*.ts",
          "tests",
          "src/**/*.test.ts",
          ...(ctx.stack.database ? [migrate, nodeEnv] : []),
        ],
      })
    ),
  ];
};

export const workerNodeEnv = (read: ReadSlot) =>
  renderEnvModule(
    read(serverEnv).filter(({ name }) => name === "DATABASE_URL"),
    false
  );

const environment = (read: ReadSlot) =>
  [
    'import { defineEnv } from "void/env";',
    ...(read(serverEnv).length ? ['import { z } from "zod";'] : []),
    "",
    "export default defineEnv({",
    ...read(serverEnv).map(
      ({ name, schema }) =>
        `  ${name}: ${name === "DATABASE_URL" ? "z.url().optional()" : schema},`
    ),
    "});",
    "",
  ].join("\n");

const config = (ctx: Context) => `import { defineConfig } from "void/config";

export default defineConfig({
  ${ctx.stack.database ? `database: "${ctx.has("mysql") ? "mysql" : "pg"}",` : ""}
  ${ctx.has("hono") || ctx.stack.database ? `inference: { ${ctx.has("hono") ? 'appType: "void", ' : ""}${ctx.stack.database ? "bindings: { db: true }" : ""} },` : ""}
  ${ctx.has("spa") ? 'routing: { notFound: "single-page-application" },' : ""}
  cloudflare: {
    name: "${ctx.name}",
    compatibility_date: "2026-10-01",
    compatibility_flags: ["nodejs_compat"],
  },
});
`;

const deploy = (ctx: Context) => {
  const dir = workerApp(ctx);

  return `import { spawnSync } from "node:child_process";

${
  ctx.stack.database
    ? `if (!process.env.DATABASE_URL) {
  throw new Error("Set DATABASE_URL in the deployment shell to the production database URL");
}

`
    : ""
}const run = (args: string[]) => {
  const result = spawnSync("vp", args, { stdio: "inherit", shell: process.platform === "win32" });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

${ctx.stack.database ? 'run(["run", "db:migrate"]);\n' : ""}${ctx.has("hono") ? `run(["run", "--filter", "${ctx.scope}/web", "build"]);\n` : ""}run(["exec", "--filter", "${ctx.scope}/${dir.slice(5)}", "void", "deploy", "--platform", "cloudflare"]);
`;
};

const routes = (ctx: Context) => {
  const database = ctx.stack.database !== undefined;

  const forward = `import { defineHandler } from "void";

import { createApp } from "#src/app.ts";
${database ? 'import { withServices } from "#src/context.ts";\n' : ""}
export const forward = defineHandler(async (c) =>
  ${database ? "await withServices(async (services) => await createApp(services).fetch(c.req.raw))" : "await createApp().fetch(c.req.raw)"}
);
`;

  return [
    file("apps/server/routes/_forward.ts", forward),
    ...[
      "api/index.ts",
      "api/[...path].ts",
      ...(ctx.has("orpc") ? ["rpc/index.ts", "rpc/[...path].ts"] : []),
    ].map((route) =>
      file(
        `apps/server/routes/${route}`,
        'export { forward as ALL } from "../_forward.ts";\n'
      )
    ),
  ];
};

export const voidDeployment = defineIntegration({
  contribute: (ctx) => {
    const dir = workerApp(ctx);
    const backend = hasBackend(ctx);
    const database = ctx.stack.database !== undefined;

    return [
      file(`${dir}/void.config.ts`, config(ctx)),
      ...(backend ? [renderFile(`${dir}/env.ts`, environment)] : []),
      ...(database
        ? [
            file(
              `${dir}/worker-env.d.ts`,
              'import "cloudflare:workers";\n\ndeclare module "cloudflare:workers" {\n  interface ProvidedEnv {\n    HYPERDRIVE: { connectionString: string };\n  }\n}\n'
            ),
          ]
        : []),
      ...(ctx.has("hono") ? routes(ctx) : []),
      ...(ctx.has("tanstack-start") && database
        ? [
            file(
              "apps/web/src/server.ts",
              `import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

import { withServices } from "#src/server/context.ts";

export default createServerEntry({
  fetch: async (request, options) =>
    await withServices(request, async () => await handler.fetch(request, options)),
});
`
            ),
          ]
        : []),
      file("scripts/deploy.ts", deploy(ctx)),
      contribute(rootTypeScriptFiles, "scripts/deploy.ts"),
      contribute(setupCommand, {
        run: `vp exec --filter ${ctx.scope}/${dir.slice(5)} void prepare`,
        stage: "generate",
        writes: [`${dir}/.void/**`],
      }),
      contribute(packageJson, {
        path: dir,
        devDependencies: ["void"],
        scripts: { prepare: "void prepare" },
      }),
      contribute(packageJson, {
        path: ".",
        scripts: { deploy: "node scripts/deploy.ts" },
      }),
      contribute(pnpmWorkspace, { allowBuilds: { workerd: true } }),
      ...[".void/", ".void-wrangler.jsonc", ".wrangler/"].map((glob) =>
        contribute(ignoredFiles, glob)
      ),
      contribute(generatedFiles, {
        glob: "**/.void/**",
        label: ".void/",
        note: "Run void prepare after cloning to regenerate Worker types",
      }),
      contribute(knipEntries, {
        workspace: dir,
        entry: [
          "void.config.ts",
          ...(backend ? ["env.ts"] : []),
          ...(ctx.has("hono") ? ["routes/**/*.ts"] : []),
          ...(ctx.has("tanstack-start") && database ? ["src/server.ts"] : []),
        ],
        ignoreDependencies: [
          ...(database ? ["cloudflare"] : []),
          ...(ctx.has("hono") ? [`${ctx.scope}/web`] : []),
        ],
      }),
      contribute(agentsMap, {
        path: "scripts/deploy.ts",
        owns: "explicit production database migration, then Void deployment",
      }),
      contribute(agentsConventions, {
        title: "Void",
        text: `Deploy with \`vp run deploy\`. Commit \`void.lock.json\`; regenerate ignored types with \`vp exec --filter ${ctx.scope}/${dir.slice(5)} void prepare\`. ${database ? "Database clients belong to one request and close when its response stream finishes, including cancellation or failure." : ""}`,
      }),
      contribute(readmeTagline, "Void"),
      contribute(readmeLayers, {
        layer: "Deployment",
        choice: "Void 1.1.11 on Cloudflare Workers (preview)",
      }),
      contribute(
        readmeSections,
        () => `## Deploy to Cloudflare with Void

This deployment option is in preview. It deploys to your own Cloudflare account; Void manages the Worker and ${database ? "Hyperdrive, while Drizzle owns the schema and migrations" : "static assets"}.

\`\`\`sh
vp exec --filter ${ctx.scope}/${dir.slice(5)} void connect --platform cloudflare
${ctx.has("better-auth") ? `vp exec --filter ${ctx.scope}/${dir.slice(5)} void secret put BETTER_AUTH_SECRET\nvp exec --filter ${ctx.scope}/${dir.slice(5)} void secret put BETTER_AUTH_URL\n` : ""}${database ? "DATABASE_URL='postgres-or-mysql-production-url' vp run deploy" : "vp run deploy"}
\`\`\`

${database ? "The deploy script requires DATABASE_URL in the shell before reading any local .env. It applies Drizzle migrations first, then deploys and creates Hyperdrive. Use the production dialect's full connection URL. Void's built-in database migrations and auth are not used.\n\n" : ""}Commit \`void.lock.json\`, which belongs to your deployment state and is never generated or merged by vibestart. Run \`void prepare\` from \`${dir}\` after cloning; the package prepare script also runs it on install. Local \`.env\` values are not uploaded. Use \`void secret put\` for production server values.

${database ? "Workers create database clients per request and release them after the response stream ends; Hyperdrive pools production connections." : ""}
`
      ),
    ];
  },
  description:
    "Deploy a SPA, SPA + Hono, or TanStack Start to Cloudflare Workers (preview)",
  homepage: "https://void.cloud",
  id: "void",
  kind: "deployment",
  name: "Void",
  provides: ["cloudflare-deployment"],
  requires: ["workers-runtime", "frontend-framework"],
  supportsAdd: true,
});
