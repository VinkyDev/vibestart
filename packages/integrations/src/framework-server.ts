import type { Context } from "@vibestart/core";
import { file } from "@vibestart/core";

import { backendHost } from "#/app-shape.ts";
import { databaseCheck } from "#/database.ts";
import { importBlock } from "#/format.ts";

export const webMigrates = (ctx: Context) =>
  backendHost(ctx.stack) === "framework" && ctx.stack.database !== undefined;

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
