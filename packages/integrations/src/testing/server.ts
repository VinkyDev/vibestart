import type { Context } from "@vibestart/core";

import { hasBackend, todosExample } from "#/app.ts";

const startCall = (dir: string, args: string[], env: string[], bun = false) =>
  `    children.push(start(${dir}, [${args.join(", ")}], { ${env.join(", ")} }${bun ? ', "bun"' : ""}));`;

// Requesting each page once compiles it before the first test waits on it.
const warmUp = (ctx: Context) => {
  if (!hasBackend(ctx)) {
    return [];
  }

  const routes = [
    "/",
    ...(ctx.has("better-auth") ? ["/login"] : []),
    ...(todosExample(ctx) ? ["/todos"] : []),
  ].map((route) => `"${route}"`);

  return [
    `    await Promise.all([${routes.join(", ")}].map(async (route) => {`,
    `      const response = await fetch(\`\${baseURL}\${route}\`);`,
    "      await response.arrayBuffer();",
    "    }));",
  ];
};

const webArgs = (ctx: Context, port: string) =>
  ctx.has("next")
    ? ['"node_modules/next/dist/bin/next"', '"dev"', '"--port"', port]
    : [
        '"node_modules/vite-plus/bin/vp"',
        '"dev"',
        '"--port"',
        port,
        '"--strictPort"',
      ];

const serverEnv = (ctx: Context) => [
  // Worker test servers share a runner; the inspector port is unnecessary for browser tests.
  ...(ctx.has("workers") ? ['VOID_INSPECTOR_PORT: "false"'] : []),
  ...(ctx.has("better-auth")
    ? [
        'BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters"',
        "BETTER_AUTH_URL: baseURL",
      ]
    : []),
  ...(ctx.stack.database === undefined ? [] : ["DATABASE_URL: database.url"]),
];

const nextDistDir = (ctx: Context, port: string) =>
  ctx.has("next") ? [`NEXT_DIST_DIR: \`.next-test-\${${port}}\``] : [];

const healthCheck = (ctx: Context) =>
  `    await waitForServer(\`\${baseURL}${hasBackend(ctx) ? "/api/health" : "/"}\`);`;

const loadEnv = (ctx: Context) =>
  hasBackend(ctx)
    ? [
        "  if (existsSync(envFile)) {",
        "    process.loadEnvFile(envFile);",
        "  }",
        "",
      ]
    : [];

// The web app on the runner's port proxies to the Hono server on the next one.
const separateServerBody = (ctx: Context) => ({
  ports: [
    "  const webPort = Number(new URL(baseURL).port);",
    "  const serverPort = String(webPort + 1);",
  ],
  starts: [
    startCall(
      "serverDir",
      ctx.has("workers") ? webArgs(ctx, "serverPort") : ['"src/index.ts"'],
      [...serverEnv(ctx), ...(ctx.has("workers") ? [] : ["PORT: serverPort"])],
      ctx.has("bun")
    ),
    `    await waitForServer(\`http://localhost:\${serverPort}/api/health\`);`,
    startCall("webDir", webArgs(ctx, "String(webPort)"), [
      ...nextDistDir(ctx, "webPort"),
      // Nitro's dev server listens on PORT over --port, and the server's .env sets PORT.
      ...(ctx.has("tanstack-start") ? ["PORT: String(webPort)"] : []),
      `SERVER_URL: \`http://localhost:\${serverPort}\``,
    ]),
  ],
});

const singleServerBody = (ctx: Context) => ({
  ports: ["  const { port } = new URL(baseURL);"],
  starts: [
    startCall("webDir", webArgs(ctx, "port"), [
      ...serverEnv(ctx),
      ...nextDistDir(ctx, "port"),
    ]),
  ],
});

const cleanup = (ctx: Context) => {
  const tasks = [
    ...(ctx.stack.database === undefined ? [] : ["database.remove()"]),
    ...(hasBackend(ctx) ? ["closeTestHttp()"] : []),
  ];

  return tasks.length === 0
    ? []
    : [
        `    results.push(...(await Promise.allSettled([${tasks.join(", ")}])));`,
      ];
};

// A failed start stops what it started, so no server outlives the run holding its port.
const startBody = (ctx: Context) => {
  const database = ctx.stack.database !== undefined;

  const { ports, starts } = ctx.has("hono")
    ? separateServerBody(ctx)
    : singleServerBody(ctx);

  return [
    ...loadEnv(ctx),
    ...ports,
    ...(database ? ["  const database = await createTestDatabase();"] : []),
    "  const children: ChildProcess[] = [];",
    "",
    "  const stopAll = async () => {",
    "    const results = await Promise.allSettled(children.map(stop));",
    "",
    ...cleanup(ctx),
    "",
    "    const errors: unknown[] = [];",
    "",
    "    for (const result of results) {",
    '      if (result.status === "rejected") {',
    "        errors.push(result.reason);",
    "      }",
    "    }",
    "",
    "    if (errors.length > 0) {",
    '      throw new AggregateError(errors, "Failed to stop test servers");',
    "    }",
    "  };",
    "",
    "  try {",
    ...starts,
    healthCheck(ctx),
    ...warmUp(ctx),
    "  } catch (error) {",
    "    try {",
    "      await stopAll();",
    "    } catch (cleanupError) {",
    '      throw new AggregateError([error, cleanupError], "Test server startup and cleanup failed", { cause: cleanupError });',
    "    }",
    "",
    "    throw error;",
    "  }",
    "",
    "  return stopAll;",
  ];
};

const imports = (ctx: Context) => [
  'import { spawn, spawnSync } from "node:child_process";',
  'import type { ChildProcess } from "node:child_process";',
  'import { once } from "node:events";',
  ...(hasBackend(ctx) ? ['import { existsSync } from "node:fs";'] : []),
  'import { fileURLToPath } from "node:url";',
  "",
  'import { retry } from "es-toolkit/function";',
  "",
  ...(ctx.stack.database === undefined
    ? []
    : [`import { createTestDatabase } from "${ctx.scope}/db/testing";`, ""]),
  ...(hasBackend(ctx)
    ? ['import { closeTestHttp } from "./http.ts";', ""]
    : []),
];

const declarations = (ctx: Context) => [
  // Another checkout runs its tests beside this one on another port.
  `export const e2eBaseURL = \`http://localhost:\${process.env.E2E_TEST_PORT ?? "3200"}\`;`,
  "",
  'const webDir = fileURLToPath(new URL("../..", import.meta.url));',
  ...(ctx.has("hono")
    ? [
        'const serverDir = fileURLToPath(new URL("../../../server", import.meta.url));',
      ]
    : []),
  ...(hasBackend(ctx)
    ? [
        `const envFile = \`\${${ctx.has("hono") ? "serverDir" : "webDir"}}/.env\`;`,
      ]
    : []),
  "",
];

// workerd can optimize Worker dependencies before listening; it needs the same cold start budget as Next.
const helpers = (
  ctx: Context
) => `const waitForServer = async (url: string, attempts = ${ctx.has("next") || (ctx.has("workers") && (ctx.has("tanstack-start") || hasBackend(ctx))) ? 300 : 100}): Promise<void> => {
  await retry(
    async () => {
      const response = await fetch(url);
      await response.arrayBuffer();

      if (!response.ok) {
        throw new Error(\`Server did not become healthy at \${url}\`);
      }
    },
    { delay: 100, retries: attempts }
  );
};

const start = (cwd: string, args: string[], env: Record<string, string>${ctx.has("bun") ? ", executable = process.execPath" : ""}) =>
  spawn(${ctx.has("bun") ? "executable" : "process.execPath"}, args, {
    cwd,
    detached: true,
    env: { ...process.env, ...env },
    // Vite closes its server on stdin EOF outside CI; keep this pipe open until teardown.
    stdio: ["pipe", "inherit", "inherit"],
  });

const stop = async (child: ChildProcess) => {
  if (child.pid === undefined || child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  const { pid } = child;

  const terminate = async (signal: "SIGTERM" | "SIGKILL") => {
    await Promise.all([
      once(child, "exit", { signal: AbortSignal.timeout(5000) }),
      Promise.resolve().then(() => {
        if (process.platform === "win32") {
          // taskkill may report already-exited descendants as errors.
          const result = spawnSync("taskkill", ["/pid", String(pid), "/t", "/f"], {
            stdio: "ignore",
            timeout: 5000,
          });

          if (result.error || result.status !== 0) {
            return child.kill();
          }

          return true;
        }

        return process.kill(-pid, signal);
      }),
    ]);
  };

  try {
    await terminate("SIGTERM");
  } catch (error) {
    if (process.platform === "win32") {
      throw error;
    }

    await terminate("SIGKILL");
  }
};
`;

/** `apps/web/tests/support/server.ts`: the stack the e2e tests drive, started once per run. */
export const renderTestServer = (ctx: Context) =>
  [
    ...imports(ctx),
    ...declarations(ctx),
    helpers(ctx),
    "export const startTestServer = async (baseURL: string) => {",
    ...startBody(ctx),
    "};",
    "",
  ].join("\n");
