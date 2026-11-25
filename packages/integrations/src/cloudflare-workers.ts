import type { Context, ReadSlot } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  file,
  packageJson,
  pnpmWorkspace,
  renderFile,
} from "@vibestart/core";

import { alchemyProject } from "#/alchemy.ts";
import { serverEnv, isSpa } from "#/app.ts";
import { catalog } from "#/catalog.ts";
import { knipEntries } from "#/knip.ts";
import {
  agentsConventions,
  agentsMap,
  ignoredFiles,
  readmeLayers,
  readmeSections,
  readmeTagline,
} from "#/vite-plus/slots.ts";
import { bindingNames, workerApp } from "#/workers.ts";

const environment = (read: ReadSlot) =>
  [
    'import { z } from "zod";',
    "",
    "const schema = z.object({",
    ...read(serverEnv).map(
      ({ name, schema }) =>
        `  ${name}: ${name === "DATABASE_URL" ? `${schema}.optional()` : schema},`
    ),
    "});",
    "",
    "export const readEnv = (bindings: Cloudflare.Env) => schema.parse(bindings);",
    "",
  ].join("\n");

const compatibilityDate = "2026-10-01";
const compatibilityFlags = ["nodejs_compat", "enable_request_signal"];

const stack = (ctx: Context) => {
  const start = ctx.has("tanstack-start");
  const staticSite = isSpa(ctx) && !ctx.has("hono");
  const database = ctx.stack.database !== undefined;
  const auth = ctx.has("better-auth");
  const assets = start ? "apps/web/dist/client" : "apps/web/dist";

  return [
    'import * as Cloudflare from "@alchemy.run/cloudflare";',
    'import * as Alchemy from "alchemy";',
    `import { ${database ? "Config, " : ""}Effect } from "effect";`,
    "",
    `export default Alchemy.Stack("${ctx.name}", {`,
    "  providers: Cloudflare.providers(),",
    "  state: Cloudflare.state(),",
    "}, Effect.gen(function* website() {",
    ...(staticSite
      ? [
          '  const site = yield* Cloudflare.Website.StaticSite("Website", {',
          `    command: "vp run --filter ${ctx.scope}/web build",`,
          `    outdir: "${assets}",`,
          '    assets: { notFoundHandling: "single-page-application" },',
        ]
      : [
          '  const site = yield* Cloudflare.Worker("Website", {',
          `    main: "${start ? "apps/web/dist/server" : "apps/server/dist/ssr"}/index.js",`,
          "    bundle: false,",
          `    compatibility: { date: "${compatibilityDate}", flags: ${JSON.stringify(compatibilityFlags)} },`,
          `    assets: { directory: "${assets}"${start ? "" : ', notFoundHandling: "single-page-application", runWorkerFirst: ["/api", "/api/*"]'} },`,
          ...(database
            ? [
                "    env: {",
                '      HYPERDRIVE: Cloudflare.Hyperdrive.Connection.lookup({ hyperdriveId: yield* Config.String("HYPERDRIVE_ID") }),',
                ...(auth
                  ? [
                      '      BETTER_AUTH_SECRET: yield* Config.Redacted("BETTER_AUTH_SECRET"),',
                      "      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? Cloudflare.Worker.URL,",
                    ]
                  : []),
                "    },",
              ]
            : []),
        ]),
    "  });",
    "",
    "  return { url: site.url };",
    "}));",
    "",
  ].join("\n");
};

const workerChecks = (ctx: Context) => {
  const database = ctx.stack.database !== undefined;

  return `${
    database
      ? `if (action === "deploy" && (env.DATABASE_URL ?? "") === "") {
  throw new Error("Set DATABASE_URL in the deployment shell to the database URL for this stage");
}

if (!/^[a-f0-9]{32}$/iu.test(env.HYPERDRIVE_ID ?? "")) {
  throw new Error("Set HYPERDRIVE_ID to a cache-disabled Hyperdrive config ID; see DEPLOYMENT.md before deploying");
}

`
      : ""
  }${
    ctx.has("better-auth")
      ? `if ((env.BETTER_AUTH_SECRET ?? "").length < 32) {
  throw new Error("Set BETTER_AUTH_SECRET to at least 32 characters in the deployment shell");
}

const origin = env.BETTER_AUTH_URL;

if (origin !== undefined) {
  const url = URL.parse(origin);

  if (url?.protocol !== "https:" || (origin !== url.origin && origin !== \`\${url.origin}/\`)) {
    throw new Error("Set BETTER_AUTH_URL to a public HTTPS origin, or omit it to use the Worker URL");
  }
}

`
      : ""
  }`;
};

const readme = (ctx: Context) =>
  [
    "## Deploy to Cloudflare with Alchemy",
    "The root `alchemy.run.ts` deploys to your Cloudflare account. Connect your account with `vp exec alchemy profile edit --add Cloudflare`. For unattended deployments, set `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. On first deploy, Alchemy bootstraps an account-wide state Worker, SQLite-backed Durable Object and Secrets Store credentials. See [Cloudflare setup](https://alchemy.run/cloudflare/setup/) and [state store permissions](https://alchemy.run/state-store/).",
    ...(ctx.stack.database === undefined
      ? []
      : [
          "In the Cloudflare dashboard, create a Hyperdrive connection to the production database with **query caching disabled** so writes and revoked sessions take effect immediately. Export its ID as `HYPERDRIVE_ID` and the matching production database URL as `DATABASE_URL` in the deployment shell. Drizzle migrates this database before upload. The deployed Worker receives only the Hyperdrive binding.",
        ]),
    ...(ctx.has("better-auth")
      ? [
          "Export `BETTER_AUTH_SECRET` (at least 32 characters). Alchemy uploads it as an encrypted Worker binding and supplies the Worker URL as the auth origin on first deploy. Set `BETTER_AUTH_URL` only to use your own public HTTPS origin.",
        ]
      : []),
    "Run `vp run plan` to inspect changes and `vp run deploy` to apply them. Both default to stage `prod`. Set `ALCHEMY_STAGE=pr-42` for an isolated preview. For previews, prefix database and auth variables with the uppercased stage and an underscore (for example `PR_42_HYPERDRIVE_ID`), using a separate database and secret. Only deploy runs Drizzle. Clean up with `vp run destroy` using the same stage, profile and bindings.",
  ].join("\n\n");

export const cloudflareWorkers = defineIntegration({
  contribute: (ctx) => {
    const dir = workerApp(ctx);
    const database = ctx.stack.database !== undefined;
    const hono = ctx.has("hono");
    const worker = hono || ctx.has("tanstack-start");

    return [
      file("alchemy.run.ts", stack(ctx)),
      ...alchemyProject({
        providers: ["@alchemy.run/cloudflare"],
        checks: workerChecks(ctx),
        build: worker,
        migrate: database,
        previewVariables: [
          ...(database ? ["DATABASE_URL", "HYPERDRIVE_ID"] : []),
          ...(ctx.has("better-auth")
            ? ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"]
            : []),
        ],
      }),
      ...(worker
        ? [
            file(
              `${dir}/wrangler.jsonc`,
              JSON.stringify({
                name: ctx.name,
                main: hono
                  ? "./src/worker.ts"
                  : "@tanstack/react-start/server-entry",
                assets: hono
                  ? {
                      not_found_handling: "single-page-application",
                      run_worker_first: ["/api", "/api/*"],
                    }
                  : undefined,
                secrets: database ? { required: bindingNames(ctx) } : undefined,
                compatibility_date: compatibilityDate,
                compatibility_flags: compatibilityFlags,
              })
            ),
            contribute(packageJson, {
              path: dir,
              devDependencies: [
                "@cloudflare/vite-plugin",
                "@cloudflare/workers-types",
              ],
            }),
          ]
        : []),
      ...(database
        ? [
            renderFile(`${dir}/env.ts`, environment),
            file(
              `${dir}/worker-env.d.ts`,
              "declare namespace Cloudflare {\n  interface Env {\n    HYPERDRIVE: Hyperdrive;\n  }\n}\n"
            ),
          ]
        : []),
      ...(hono
        ? [
            file(
              `${dir}/src/worker.ts`,
              [
                'import { createApp } from "#src/app.ts";',
                ...(database
                  ? ['import { withServices } from "#src/context.ts";']
                  : []),
                "",
                "export default {",
                "  async fetch(request: Request) {",
                database
                  ? "    return await withServices(async (services) => await createApp(services).fetch(request));"
                  : "    return await createApp().fetch(request);",
                "  },",
                "} satisfies ExportedHandler;",
                "",
              ].join("\n")
            ),
          ]
        : []),
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
      contribute(pnpmWorkspace, { allowBuilds: { workerd: true } }),
      contribute(ignoredFiles, ".wrangler/"),
      ...(hono
        ? [
            contribute(knipEntries, {
              workspace: dir,
              entry: ["src/worker.ts"],
              ignoreDependencies: [`${ctx.scope}/web`],
            }),
          ]
        : []),
      contribute(agentsMap, {
        path: "alchemy.run.ts",
        owns: "Cloudflare resources, asset routing and deployment bindings",
      }),
      contribute(agentsConventions, {
        title: "Alchemy",
        text: "Deploy the prod stage with `vp run deploy`. Follow the Cloudflare setup and production configuration in DEPLOYMENT.md.",
      }),
      contribute(readmeTagline, "Alchemy"),
      contribute(readmeLayers, {
        layer: "Deployment",
        choice: `Alchemy ${catalog.server.alchemy} on Cloudflare Workers (preview)`,
      }),
      file("DEPLOYMENT.md", `${readme(ctx).replace(/^## /u, "# ")}\n`),
      contribute(
        readmeSections,
        () =>
          "## Production\n\nFollow [the Cloudflare Workers deployment guide](DEPLOYMENT.md) to configure bindings, plan changes and deploy."
      ),
    ];
  },
  description:
    "Deploy a SPA, SPA + Hono, or TanStack Start to Cloudflare Workers (preview)",
  homepage: "https://alchemy.run/",
  id: "cloudflare-workers",
  kind: "deployment",
  name: "Cloudflare Workers (Alchemy)",
  provides: ["cloudflare-deployment"],
  requires: ["workers-runtime", "frontend-framework"],
  supportsAdd: true,
});
