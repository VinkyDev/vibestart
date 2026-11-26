import type { ReadSlot } from "@vibestart/core";
import {
  contribute,
  file,
  defineIntegration,
  renderFile,
  packageJson,
  pnpmWorkspace,
} from "@vibestart/core";

import { knipEntries } from "#/knip.ts";
import { serverEnv } from "#/server-environment.ts";
import { ignoredFiles, readmeSections } from "#/vite-plus/slots.ts";
import { workerApp } from "#/workers/app.ts";
import { authSecrets } from "#/workers/vite-config.ts";

const environment = (read: ReadSlot) =>
  [
    'import { z } from "zod";',
    "",
    "const schema = z.object({",
    ...read(serverEnv).map(({ name, schema }) => `  ${name}: ${schema},`),
    "});",
    "",
    "export const readEnv = ({ HYPERDRIVE, ...bindings }: Cloudflare.Env) =>",
    "  schema.parse({ ...bindings, DATABASE_URL: HYPERDRIVE.connectionString });",
    "",
  ].join("\n");

const compatibilityDate = "2026-10-01";
const compatibilityFlags = ["nodejs_compat", "enable_request_signal"];

export const workers = defineIntegration({
  auxiliary: true,
  id: "workers",
  kind: "runtime",
  name: "Cloudflare Workers",
  description: "Run the web app on Cloudflare Workers",
  homepage: "https://developers.cloudflare.com/workers/",
  provides: ["workers-runtime"],
  requires: ["frontend-framework"],
  choices: { deployment: [null] },
  contribute: (ctx) => {
    const dir = workerApp(ctx);
    const database = ctx.stack.database !== undefined;
    const hono = ctx.has("hono");
    const worker = hono || ctx.has("tanstack-start");

    return [
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
                hyperdrive: database
                  ? [{ binding: "HYPERDRIVE", id: "your-hyperdrive-id" }]
                  : undefined,
                secrets: ctx.has("better-auth")
                  ? { required: authSecrets }
                  : undefined,
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
            contribute(
              readmeSections,
              () =>
                `## Workers database\n\nLocal development and migrations use \`DATABASE_URL\`. Before deploying, replace \`your-hyperdrive-id\` in \`${dir}/wrangler.jsonc\` with the ID of a cache-disabled [Hyperdrive configuration](https://developers.cloudflare.com/hyperdrive/) for the same database. The deployed Worker connects through the \`HYPERDRIVE\` binding. Run migrations against that database before switching traffic.`
            ),
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
    ];
  },
});
