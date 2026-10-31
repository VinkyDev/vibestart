import type { Context } from "@vibestart/core";
import { file } from "@vibestart/core";

import { replaceOnce, templateContent, templateFiles } from "#/templates.ts";

import { todoHandlers, todoService } from "./todos.ts";

export const todoFiles = (ctx: Context) => {
  const path = "packages/contracts/src/rpc.ts";
  let contract = templateContent(ctx, "effect-rpc/todos", path);

  if (!ctx.has("better-auth")) {
    contract = replaceOnce(
      contract,
      'import { AuthMiddleware } from "#src/auth.ts";\n',
      "",
      path
    );
    contract = replaceOnce(contract, ".middleware(AuthMiddleware)", "", path);
  }

  return [
    ...templateFiles(ctx, "effect-rpc/todos", { except: [path] }),
    file(path, contract),
    todoService(ctx),
    todoHandlers(ctx),
  ];
};

export const contractIndex = (ctx: Context) =>
  file(
    "packages/contracts/src/index.ts",
    [
      ...(ctx.has("better-auth")
        ? [
            'export { AuthMiddleware, CurrentUser, Unauthorized, InternalServerError } from "#src/auth.ts";',
          ]
        : []),
      `export { Api, ${ctx.stack.database === undefined ? "" : "DatabaseUnavailable, "}HealthGroup } from "#src/http-api.ts";`,
      ...(ctx.stack.database === undefined
        ? ['export { HealthRpcs } from "#src/rpc.ts";']
        : [
            'export { TodosRpcs } from "#src/rpc.ts";',
            'export { Todo, TodoId, TodoNotFound, TodoTitle } from "#src/todo.ts";',
            'export { ServiceUnavailable } from "#src/errors.ts";',
          ]),
    ].join("\n\n")
  );

export const routes = (ctx: Context) =>
  file(
    "packages/api/src/index.ts",
    `
import { Config, Effect, Layer } from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/http-api";
import { RpcSerialization, RpcServer } from "effect/rpc";

import { Api, ${ctx.stack.database === undefined ? "HealthRpcs" : "TodosRpcs"} } from "${ctx.scope}/contracts";

${ctx.has("better-auth") ? 'import { AuthRoutes } from "#src/auth-routes.ts";\nimport { AuthMiddlewareLive } from "#src/auth-middleware.ts";' : ""}
import { HealthLive } from "#src/health.ts";
import { ${ctx.stack.database === undefined ? "HealthRpcLive" : "TodosLive"} } from "#src/rpc.ts";
${ctx.stack.database === undefined ? "" : 'import { Todos } from "#src/todos.ts";'}

const RpcOrigin = Layer.unwrap(
  Effect.gen(function* () {
    const allowedOrigin = new URL(yield* Config.String("${ctx.has("better-auth") ? "BETTER_AUTH_URL" : "APP_URL"}")).origin;

    return HttpRouter.middleware((httpEffect) =>
      Effect.gen(function* () {
        const request = yield* HttpServerRequest.HttpServerRequest;
        const { origin } = request.headers;

        if (origin !== undefined && origin !== allowedOrigin) {
          return HttpServerResponse.empty({ status: 403 });
        }

        return yield* httpEffect;
      })
    ).layer;
  })
);

const RpcRoutes = RpcServer.layerHttp({
  group: ${ctx.stack.database === undefined ? "HealthRpcs" : "TodosRpcs"},
  path: "/rpc",
  protocol: "http",
}).pipe(
  Layer.provide([
    ${ctx.stack.database === undefined ? "HealthRpcLive" : "TodosLive"},
    ${ctx.has("better-auth") ? "AuthMiddlewareLive," : ""}
    RpcSerialization.layerNdjson,
    RpcOrigin,
  ]),
  ${ctx.stack.database === undefined ? "" : "Layer.provide(Todos.layer)"}
);

const ApiRoutes = Layer.mergeAll(
  HttpApiBuilder.layer(Api, { openapiPath: "/api/openapi.json" }),
  HttpApiScalar.layer(Api, { path: "/api/docs" })
).pipe(Layer.provide(HealthLive));

const SecurityHeaders = HttpRouter.middleware(
  (effect) => effect.pipe(Effect.map(HttpServerResponse.setHeaders({
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
  }))),
  { global: true }
);

export const Routes = Layer.mergeAll(
  ${ctx.has("better-auth") ? "AuthRoutes," : ""}
  RpcRoutes,
  ApiRoutes,
  SecurityHeaders
);
`
  );

export const todoWebFiles = (ctx: Context) => {
  const page = "apps/web/src/routes/_authenticated/todos.tsx";
  const notify = "apps/web/src/lib/notify.ts";
  let pageSource = templateContent(ctx, "effect-rpc/todos-web", page);
  let notifySource = templateContent(ctx, "effect-rpc/todos-web", notify);

  if (!ctx.has("better-auth")) {
    pageSource = replaceOnce(
      pageSource,
      'createFileRoute("/_authenticated/todos")',
      'createFileRoute("/todos")',
      page
    );
    notifySource = replaceOnce(
      notifySource,
      "TodoNotFound, Unauthorized",
      "TodoNotFound",
      notify
    );
    notifySource = replaceOnce(
      notifySource,
      '  if (error instanceof Unauthorized) {\n    return "Your session has ended. Sign in again.";\n  }\n\n',
      "",
      notify
    );
  }

  return [
    ...templateFiles(ctx, "effect-rpc/todos-web", { except: [page, notify] }),
    file(
      ctx.has("better-auth") ? page : "apps/web/src/routes/todos.tsx",
      pageSource
    ),
    file(notify, notifySource),
  ];
};

export const databaseHealth = (ctx: Context) => {
  const path = "packages/api/src/health.ts";
  const source = templateContent(ctx, "effect-rpc/database", path);

  return file(
    path,
    ctx.has("sqlite")
      ? replaceOnce(source, "db.execute(", "db.run(", path)
      : source
  );
};
