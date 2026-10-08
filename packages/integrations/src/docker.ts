import type { Context, ReadSlot } from "@vibestart/core";
import {
  contribute,
  defineIntegration,
  defineSlot,
  packageJson,
  renderFile,
} from "@vibestart/core";

import { hasBackend, hasWebApp, proxiesToHono } from "#/app.ts";
import { toolchainVersions } from "#/catalog.ts";
import { joinWords, quote } from "#/format.ts";
import {
  ignoredFiles,
  readmeLayers,
  readmeSections,
  readmeTagline,
} from "#/vite-plus/slots.ts";

/** The runtime stage of the image. Exactly one contribution sets `cmd`. */
export const dockerRuntime = defineSlot<{
  env?: readonly (readonly [string, string])[];
  copies?: readonly (readonly [from: string, to: string])[];
  runs?: readonly string[];
  volumes?: readonly string[];
  cmd?: readonly string[];
}>("docker/runtime");

export const composeServices = defineSlot<{
  name: string;
  readyWhen: "service_healthy";
  yaml: string;
}>("docker/compose-services");

export const composeEnv = defineSlot<{ name: string; value: string }>(
  "docker/compose-env"
);

export const composeAppVolumes = defineSlot<string>(
  "docker/compose-app-volumes"
);

export const composeVolumes = defineSlot<string>("docker/compose-volumes");

/** The `app` service waits for it to be healthy and gets `appEnv` to reach it. */
export const composeServers = defineSlot<{
  name: string;
  command: readonly string[];
  appEnv: readonly (readonly [name: string, value: string])[];
}>("docker/compose-servers");

// Without a Node.js runtime the build is static files, which nginx serves with the SPA fallback.
const staticRuntime = [
  [
    "FROM nginxinc/nginx-unprivileged:1.30-alpine AS runtime",
    "COPY <<'EOF' /etc/nginx/conf.d/default.conf",
    "server {",
    "  listen 3000;",
    "  root /usr/share/nginx/html;",
    "  location / {",
    "    try_files $uri $uri/ /index.html;",
    "  }",
    "}",
    "EOF",
    "COPY --from=build /app/apps/web/dist /usr/share/nginx/html",
  ].join("\n"),
  [
    "EXPOSE 3000",
    "HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \\",
    "  CMD wget --quiet --spider http://127.0.0.1:3000/ || exit 1",
  ].join("\n"),
];

const nodeRuntime = (ctx: Context, read: ReadSlot) => {
  const runtime = read(dockerRuntime);
  const env = runtime.flatMap((part) => part.env ?? []);
  const copies = runtime.flatMap((part) => part.copies ?? []);
  const runs = runtime.flatMap((part) => part.runs ?? []);
  const volumes = runtime.flatMap((part) => part.volumes ?? []);
  const [cmd, ...extraCmds] = runtime.flatMap((part) =>
    part.cmd === undefined ? [] : [part.cmd]
  );
  if (cmd === undefined || extraCmds.length > 0) {
    throw new Error("Exactly one integration must set the Docker CMD");
  }
  const health = hasBackend(ctx) ? "/api/health" : "/";
  return [
    [
      ctx.has("bun")
        ? `FROM oven/bun:${toolchainVersions.bun}-slim AS runtime`
        : "FROM debian:trixie-slim AS runtime",
      "WORKDIR /app",
      `ENV ${[["NODE_ENV", "production"], ["PORT", "3000"], ...env].map(([name, value]) => `${name}=${value}`).join(" ")}`,
    ].join("\n"),
    [
      "COPY --from=build /tmp/node /usr/local/bin/node",
      ...copies.map(([from, to]) => `COPY --from=build ${from} ${to}`),
      ...runs.map((command) => `RUN ${command}`),
    ].join("\n"),
    [
      "USER nobody",
      ...volumes.map((volume) => `VOLUME ${volume}`),
      "EXPOSE 3000",
      "HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \\",
      `  CMD ["node", "-e", "fetch('http://127.0.0.1:3000${health}').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]`,
      `CMD [${cmd.map(quote).join(", ")}]`,
    ].join("\n"),
  ];
};

const renderDockerfile = (ctx: Context, read: ReadSlot) => {
  const node = ctx.has("node") || ctx.has("bun");
  const packagePaths = read(packageJson)
    .map((pkg) => pkg.path)
    .filter(
      (path, index, paths) => path !== "." && paths.indexOf(path) === index
    )
    .toSorted();

  return `${[
    "# syntax=docker/dockerfile:1",
    ...(ctx.packageManager === "bun"
      ? [`FROM oven/bun:${toolchainVersions.bun} AS bun`]
      : []),
    [
      `FROM ghcr.io/voidzero-dev/vite-plus:${toolchainVersions.vitePlus} AS build`,
      "WORKDIR /app",
    ].join("\n"),
    [
      ...(ctx.packageManager === "bun"
        ? ["COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun"]
        : []),
      ctx.packageManager === "bun"
        ? "COPY --chown=vp:vp package.json bun.lock .node-version ./"
        : "COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version ./",
      ...packagePaths.map(
        (path) => `COPY --chown=vp:vp ${path}/package.json ${path}/`
      ),
      "RUN vp install --frozen-lockfile",
    ].join("\n"),
    [
      "COPY --chown=vp:vp . .",
      "RUN vp run build",
      ...(node ? ['RUN cp "$(vp env which node | head -1)" /tmp/node'] : []),
    ].join("\n"),
    ...(node ? nodeRuntime(ctx, read) : staticRuntime),
  ].join("\n\n")}\n`;
};

const migrateService = (
  ctx: Context,
  services: readonly { name: string; readyWhen: string }[]
) =>
  [
    "  migrate:",
    "    <<: *app",
    `    command: ["${ctx.has("bun") ? "bun" : "node"}", "dist/migrate.mjs"]`,
    ...(services.length > 0
      ? [
          "    depends_on:",
          ...services.flatMap((service) => [
            `      ${service.name}:`,
            `        condition: ${service.readyWhen}`,
          ]),
        ]
      : []),
  ].join("\n");

const dependsOn = (dependencies: readonly (readonly [string, string])[]) =>
  dependencies.length > 0
    ? [
        "    depends_on:",
        ...dependencies.flatMap(([service, condition]) => [
          `      ${service}:`,
          `        condition: ${condition}`,
        ]),
      ]
    : [];

const renderCompose = (ctx: Context, read: ReadSlot) => {
  const { name } = ctx;
  const database = ctx.stack.database !== undefined;
  const migrated = database
    ? [["migrate", "service_completed_successfully"] as const]
    : [];
  const servers = read(composeServers);
  const appEnv = servers.flatMap((server) => server.appEnv);
  const services = read(composeServices);
  const env = read(composeEnv);
  const appVolumes = read(composeAppVolumes);
  const volumes = read(composeVolumes);

  return `${[
    `name: ${name}`,
    [
      "x-app: &app",
      "  build: .",
      `  image: ${name}`,
      ...(env.length > 0
        ? [
            "  environment:",
            ...env.map((variable) => `    ${variable.name}: ${variable.value}`),
          ]
        : []),
      ...(appVolumes.length > 0
        ? ["  volumes:", ...appVolumes.map((volume) => `    - ${volume}`)]
        : []),
    ].join("\n"),
    [
      "services:",
      ...services.map((service) => `${service.yaml}\n`),
      ...(database ? [migrateService(ctx, services), ""] : []),
      ...servers.flatMap((server) => [
        [
          `  ${server.name}:`,
          "    <<: *app",
          `    command: [${server.command.map(quote).join(", ")}]`,
          ...dependsOn(migrated),
          "    restart: unless-stopped",
        ].join("\n"),
        "",
      ]),
      [
        "  app:",
        "    <<: *app",
        // The app reaches the servers only; the variables shared through `x-app` are theirs.
        ...(appEnv.length > 0
          ? [
              "    environment:",
              ...appEnv.map(
                ([variable, value]) => `      ${variable}: ${value}`
              ),
            ]
          : []),
        ...dependsOn(
          servers.length > 0
            ? servers.map((server) => [server.name, "service_healthy"] as const)
            : migrated
        ),
        "    ports:",
        '      - "3000:3000"',
        "    restart: unless-stopped",
      ].join("\n"),
    ].join("\n"),
    ...(volumes.length > 0
      ? [["volumes:", ...volumes.map((volume) => `  ${volume}:`)].join("\n")]
      : []),
  ].join("\n\n")}\n`;
};

export const renderDevCompose = (ctx: Context, read: ReadSlot) => {
  const volumes = read(composeVolumes);
  return `${[
    `name: ${ctx.name}`,
    ["services:", ...read(composeServices).map((service) => service.yaml)].join(
      "\n\n"
    ),
    ...(volumes.length > 0
      ? [["volumes:", ...volumes.map((volume) => `  ${volume}:`)].join("\n")]
      : []),
  ].join("\n\n")}\n`;
};

const renderDockerignore = (read: ReadSlot) =>
  [
    ".git",
    ...read(ignoredFiles).map((pattern) => `**/${pattern}`),
    "**/.env",
    "**/.env.*",
    "!**/.env.example",
    "",
  ].join("\n");

const deployChoice = (ctx: Context) => {
  if (!ctx.has("node") && !ctx.has("bun")) {
    return "Docker: nginx serving the static build";
  }
  if (proxiesToHono(ctx)) {
    return `Docker: the ${ctx.has("next") ? "Next.js standalone" : "Nitro"} server and the Hono server from one image${ctx.has("sqlite") ? ", SQLite on a volume" : ""}`;
  }
  const image = ctx.has("next")
    ? "Next.js standalone server"
    : `${ctx.has("tanstack-start") ? "one Nitro server, one image" : "one self-contained image"}, no \`node_modules\` at runtime`;
  return `Docker: ${image}${ctx.has("sqlite") ? ", SQLite on a volume" : ""}`;
};

const serverServes = (ctx: Context, routes: readonly string[]) => {
  if (ctx.has("spa")) {
    return [...routes, "the SPA"];
  }
  return hasWebApp(ctx) ? ["the pages", ...routes] : routes;
};

const appServed = (ctx: Context) => {
  if (ctx.has("spa")) {
    return "the API and the web app";
  }
  return hasWebApp(ctx) ? "the app" : "the API";
};

const staticProduction = [
  "## Production",
  "```sh\ndocker compose up --build\n```",
  "This serves the web app on http://localhost:3000. The image is nginx with the files `vp run build` writes to `apps/web/dist`; a path with no file falls back to `index.html`, so client-side routes load directly.",
].join("\n\n");

const apiRoutes = (ctx: Context) => {
  if (ctx.has("orpc")) {
    return ["`/rpc`", "`/api`"];
  }
  return ctx.has("openapi") ? ["`/api`"] : ["`/api/health`"];
};

const renderProduction = (ctx: Context, read: ReadSlot) => {
  if (!ctx.has("node") && !ctx.has("bun")) {
    return staticProduction;
  }
  const auth = ctx.has("better-auth");
  const [cmd] = read(dockerRuntime).flatMap((part) =>
    part.cmd === undefined ? [] : [part.cmd]
  );
  const routes = hasBackend(ctx)
    ? [...apiRoutes(ctx), ...(auth ? ["`/api/auth`"] : [])]
    : [];
  const server = `\`${cmd?.join(" ")}\``;
  const [apiServer] = read(composeServers);
  const pageRoutes = apiServer === undefined ? routes : [];
  const pages = ctx.has("next")
    ? `${server} is the Next.js standalone server for ${joinWords(["the pages", ...pageRoutes])}`
    : `${server} serves ${joinWords(serverServes(ctx, pageRoutes))}`;
  const forwarded = ctx.has("orpc") ? "`/rpc` and `/api`" : "`/api`";
  const serves =
    apiServer === undefined
      ? `${pages}.`
      : `\`${apiServer.command.join(" ")}\` (the \`${apiServer.name}\` service) serves ${joinWords(routes)};\n- ${pages}, and forwards ${forwarded} to it at \`SERVER_URL\`.`;
  const variables = [
    "`DATABASE_URL`",
    ...(auth
      ? ["`BETTER_AUTH_URL` (the public origin)", "`BETTER_AUTH_SECRET`"]
      : []),
  ];
  const starts = ctx.has("postgres") ? "starts PostgreSQL, " : "";
  const app = appServed(ctx);
  if (ctx.stack.database === undefined) {
    return [
      "## Production",
      "```sh\ndocker compose up --build\n```",
      ...(apiServer === undefined
        ? [
            `This serves ${app} on http://localhost:3000. ${serves} It reads \`PORT\` (default \`3000\`).`,
          ]
        : [
            `This serves ${app} on http://localhost:3000. The image runs two entry points from the same build:`,
            `- ${serves}`,
            "The app reads `SERVER_URL`, and each server reads `PORT` (default `3000`).",
          ]),
    ].join("\n\n");
  }
  return [
    "## Production",
    `\`\`\`sh\n${auth ? "BETTER_AUTH_SECRET=$(openssl rand -base64 32) " : ""}docker compose up --build\n\`\`\``,
    `This ${starts}runs migrations once, then serves ${app} on http://localhost:3000.${ctx.has("sqlite") ? " The database lives at `/data/app.db` on the `data` volume." : ""}`,
    `The image runs ${apiServer === undefined ? "two" : "three"} entry points from the same build:`,
    `- \`${ctx.has("bun") ? "bun" : "node"} dist/migrate.mjs\` applies pending migrations and exits;\n- ${serves}`,
    apiServer === undefined
      ? `Both read ${joinWords(variables)}; the server also reads \`PORT\` (default \`3000\`).`
      : `The migration and the API server read ${joinWords(variables)}, and the app reads \`SERVER_URL\`. Each server also reads \`PORT\` (default \`3000\`).`,
    ...(ctx.has("sqlite")
      ? [
          "SQLite allows one writer at a time, so run a single app replica. Back up the volume, or move to the PostgreSQL template when you need several.",
        ]
      : []),
  ].join("\n\n");
};

export const docker = defineIntegration({
  supportsAdd: true,
  contribute: (ctx) => [
    renderFile("Dockerfile", (read) => renderDockerfile(ctx, read)),
    renderFile("docker-compose.yml", (read) => renderCompose(ctx, read)),
    renderFile(".dockerignore", renderDockerignore),
    contribute(readmeTagline, "Docker"),
    contribute(readmeLayers, { choice: deployChoice(ctx), layer: "Deploy" }),
    contribute(readmeSections, (read) => renderProduction(ctx, read)),
  ],
  id: "docker",
  kind: "deployment",
  name: "Docker",
  description: "Production Dockerfile and Docker Compose",
  homepage: "https://www.docker.com",
});
