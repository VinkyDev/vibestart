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
import { catalog } from "#/catalog.ts";
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

const workerPackage = (ctx: Context) =>
  `${ctx.scope}/${workerApp(ctx).slice("apps/".length)}`;

// A SPA without a backend deploys as static assets; Void runs no Worker code for it.
const staticSite = (ctx: Context) => ctx.has("spa") && !hasBackend(ctx);

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
          '    throw new Error("Services require the request middleware in src/start.ts");',
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
    "    const { body } = response;",
    "",
    "    if (body === null) {",
    "      return response;",
    "    }",
    "",
    "    const { readable, writable } = new TransformStream<Uint8Array>();",
    "    const forwarded = new Response(readable, response);",
    "",
    "    const transfer = async () => {",
    "      try {",
    "        await body.pipeTo(writable);",
    "      } finally {",
    "        await dispose();",
    "      }",
    "    };",
    "",
    "    streaming = true;",
    "    waitUntil(transfer());",
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
  const database = ctx.stack.database !== undefined;
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
        extends: `${ctx.scope}/config/typescript/${start ? "react" : "node"}.json`,
        compilerOptions: { types: ["node", ...(start ? ["vite/client"] : [])] },
        include: [
          "*.config.ts",
          "config/**/*.ts",
          "tests",
          "src/**/*.test.ts",
          ...(database ? [migrate, nodeEnv] : []),
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
        `  ${name}: ${name === "DATABASE_URL" ? `${schema}.optional()` : schema},`
    ),
    "});",
    "",
  ].join("\n");

const config = (ctx: Context) => {
  const database = ctx.stack.database !== undefined;
  const site = staticSite(ctx);

  const inference = [
    ...(site ? ['appType: "spa"'] : []),
    ...(ctx.has("hono") ? ['appType: "void"'] : []),
    ...(database ? ["bindings: { db: true }"] : []),
  ];

  return [
    'import { defineConfig } from "void/config";',
    "",
    "export default defineConfig({",
    ...(database
      ? [`  database: "${ctx.has("mysql") ? "mysql" : "pg"}",`]
      : []),
    ...(inference.length > 0
      ? [`  inference: { ${inference.join(", ")} },`]
      : []),
    ...(ctx.has("hono")
      ? ['  routing: { notFound: "single-page-application" },']
      : []),
    "  cloudflare: {",
    `    name: "${ctx.name}",`,
    ...(database
      ? [
          "    // Local tooling infers its binding; deploy.ts requires an existing cache-disabled production ID.",
          '    hyperdrive: process.env.HYPERDRIVE_ID === undefined ? undefined : [{ binding: "HYPERDRIVE", id: process.env.HYPERDRIVE_ID }],',
        ]
      : []),
    '    compatibility_date: "2026-10-01",',
    ...(site
      ? []
      : [
          "    // Without enable_request_signal, `request.signal` never aborts when the client disconnects.",
          '    compatibility_flags: ["nodejs_compat", "enable_request_signal"],',
        ]),
    "  },",
    "});",
    "",
  ].join("\n");
};

const deploy = (ctx: Context) => {
  const database = ctx.stack.database !== undefined;

  return `import { spawnSync } from "node:child_process";

${
  database
    ? `if (process.env.DATABASE_URL === undefined || process.env.DATABASE_URL === "") {
  throw new Error("Set DATABASE_URL in the deployment shell to the production database URL");
}

if (!/^[a-f0-9]{32}$/iu.test(process.env.HYPERDRIVE_ID ?? "")) {
  throw new Error("Set HYPERDRIVE_ID to a cache-disabled Hyperdrive config ID; see README.md before deploying");
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

${database ? 'run(["run", "db:migrate"]);\n\n' : ""}${ctx.has("hono") ? `run(["run", "--filter", "${ctx.scope}/web", "build"]);\n\n` : ""}run(["exec", "--filter", "${workerPackage(ctx)}", "void", "deploy", "--platform", "cloudflare"]);
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
    ...["api/index.ts", "api/[...path].ts"].map((route) =>
      file(
        `apps/server/routes/${route}`,
        'export { forward as DELETE, forward as GET, forward as OPTIONS, forward as PATCH, forward as POST, forward as PUT } from "../_forward.ts";\n'
      )
    ),
  ];
};

const productionUrl = (ctx: Context) =>
  ctx.has("mysql")
    ? `mysql://user:password@host:3306/${ctx.name}`
    : `postgresql://user:password@host:5432/${ctx.name}`;

const managed = (ctx: Context) => {
  if (ctx.stack.database !== undefined) {
    return "Void manages the Worker and binds your existing Hyperdrive, while Drizzle owns the schema and migrations.";
  }

  return staticSite(ctx)
    ? "Void builds the SPA and uploads it as static assets."
    : "Void manages the Worker and its static assets.";
};

const readme = (ctx: Context) => {
  const dir = workerApp(ctx);
  const exec = `vp exec --filter ${workerPackage(ctx)} void`;
  const database = ctx.stack.database !== undefined;
  const auth = ctx.has("better-auth");
  const site = staticSite(ctx);

  const commands = [
    `${exec} connect --platform cloudflare`,
    ...(auth
      ? [
          `${exec} secret put BETTER_AUTH_SECRET`,
          `${exec} secret put BETTER_AUTH_URL`,
        ]
      : []),
    database
      ? `HYPERDRIVE_ID='<cache-disabled-config-id>' DATABASE_URL='${productionUrl(ctx)}' vp run deploy`
      : "vp run deploy",
  ];

  const paragraphs = [
    `This deployment option is in preview. It deploys to your own Cloudflare account; ${managed(ctx)}`,
    ...(database
      ? [
          "Before the first deploy, create a Hyperdrive configuration in the Cloudflare dashboard for the production database and turn **Query caching off**. Supply its ID as `HYPERDRIVE_ID` in every deployment shell; `void.config.ts` binds that existing resource. Void's browser login can deploy an existing binding without a Hyperdrive-edit API token, but cannot create one. Automatic provisioning is not used because it enables query caching, which can return stale todos or revoked sessions after a write. Connection pooling still works with caching disabled.",
        ]
      : []),
    ["```sh", ...commands, "```"].join("\n"),
    ...(database
      ? [
          [
            "In PowerShell, set the deployment values before running the same command:",
            "```powershell",
            "$env:HYPERDRIVE_ID = '<cache-disabled-config-id>'",
            `$env:DATABASE_URL = '${productionUrl(ctx)}'`,
            "vp run deploy",
            "```",
          ].join("\n"),
        ]
      : []),
    ...(auth
      ? [
          `\`BETTER_AUTH_URL\` is the origin users open: your custom domain, or \`https://${ctx.name}.<your-subdomain>.workers.dev\`. Void checks \`env.ts\` before uploading, so set both secrets before the first deploy.`,
        ]
      : []),
    ...(database
      ? [
          "The deploy script requires an explicit `DATABASE_URL` and a valid `HYPERDRIVE_ID` in the shell before reading any local `.env` or applying Drizzle migrations. Both must target the same production database. It then deploys using the existing Hyperdrive; its cache-disabled setting remains your responsibility. Keep these deployment values out of Worker secrets: the Worker prefers `DATABASE_URL` over Hyperdrive, which is how `void dev` reaches a local database. Void's built-in database migrations and auth are not used.",
        ]
      : []),
    `Commit \`void.lock.json\`, which belongs to your deployment state and is never generated or merged by vibestart.${
      site
        ? ""
        : ` Run \`void prepare\` from \`${dir}\` after cloning; the package prepare script also runs it on install. Local \`.env\` values are not uploaded. Use \`void secret put\` for production server values.`
    }`,
    ...(database
      ? [
          "Workers create database clients per request and release them after the response stream ends; Hyperdrive pools production connections.",
        ]
      : []),
  ];

  return ["## Deploy to Cloudflare with Void", ...paragraphs].join("\n\n");
};

export const voidDeployment = defineIntegration({
  contribute: (ctx) => {
    const dir = workerApp(ctx);
    const backend = hasBackend(ctx);
    const database = ctx.stack.database !== undefined;
    const site = staticSite(ctx);

    return [
      file(`${dir}/void.config.ts`, config(ctx)),
      ...(backend ? [renderFile(`${dir}/env.ts`, environment)] : []),
      ...(database
        ? [
            file(
              `${dir}/worker-env.d.ts`,
              "declare namespace Cloudflare {\n  interface Env {\n    HYPERDRIVE: Hyperdrive;\n  }\n}\n"
            ),
          ]
        : []),
      ...(ctx.has("hono") ? routes(ctx) : []),
      ...(ctx.has("tanstack-start") && database
        ? [
            file(
              "apps/web/src/start.ts",
              `import { createCsrfMiddleware, createMiddleware, createStart } from "@tanstack/react-start";

import { withServices } from "#src/server/context.ts";

const services = createMiddleware().server(async ({ next, request }) =>
  await withServices(request, async () => {
    const result = await next();

    return result.response;
  })
);

const csrf = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });

export const startInstance = createStart(() => ({
  requestMiddleware: [csrf, services],
}));
`
            ),
          ]
        : []),
      file("scripts/deploy.ts", deploy(ctx)),
      contribute(rootTypeScriptFiles, "scripts/deploy.ts"),
      ...(site
        ? []
        : [
            contribute(setupCommand, {
              run: `vp exec --filter ${workerPackage(ctx)} void prepare`,
              stage: "generate",
              writes: [`${dir}/.void/**`],
            }),
            contribute(packageJson, {
              path: dir,
              scripts: { prepare: "void prepare" },
            }),
          ]),
      contribute(packageJson, { path: dir, devDependencies: ["void"] }),
      contribute(packageJson, {
        path: ".",
        scripts: { deploy: "node scripts/deploy.ts" },
      }),
      contribute(pnpmWorkspace, { allowBuilds: { workerd: true } }),
      ...[".void/", ".void-wrangler.jsonc", ".wrangler/"].map((glob) =>
        contribute(ignoredFiles, glob)
      ),
      ...(site
        ? []
        : [
            contribute(generatedFiles, {
              glob: "**/.void/**",
              label: ".void/",
              note: "Run void prepare after cloning to regenerate Worker types",
            }),
          ]),
      contribute(knipEntries, {
        workspace: dir,
        entry: [
          "void.config.ts",
          ...(backend ? ["env.ts"] : []),
          ...(ctx.has("hono") ? ["routes/**/*.ts"] : []),
        ],
        ignoreDependencies: ctx.has("hono") ? [`${ctx.scope}/web`] : undefined,
      }),
      contribute(agentsMap, {
        path: "scripts/deploy.ts",
        owns: database
          ? "production database and Hyperdrive prerequisites, migration, then Void deployment"
          : "Void deployment",
      }),
      contribute(agentsConventions, {
        title: "Void",
        text: [
          "Deploy with `vp run deploy`. Commit `void.lock.json`.",
          ...(site
            ? []
            : [
                `Regenerate ignored types with \`vp exec --filter ${workerPackage(ctx)} void prepare\`.`,
              ]),
          ...(database
            ? [
                "Set `DATABASE_URL` and `HYPERDRIVE_ID` in the deployment shell for the same production database. Provision Hyperdrive with query caching disabled; Void binds that existing ID.",
                "Database clients belong to one request and close when its response stream finishes, including cancellation or failure.",
              ]
            : []),
        ].join(" "),
      }),
      contribute(readmeTagline, "Void"),
      contribute(readmeLayers, {
        layer: "Deployment",
        choice: `Void ${catalog.server.void} on Cloudflare Workers (preview)`,
      }),
      contribute(readmeSections, () => readme(ctx)),
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
