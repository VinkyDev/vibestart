import type { Context } from "@vibestart/core";

// Cloudflare runs the Hono Worker before static assets only under /api.
export const rpcPath = (ctx: Context) =>
  ctx.has("hono") && ctx.has("workers") ? "/api/rpc" : "/rpc";

export const serverPaths = (ctx: Context) => {
  if (ctx.stack.backend === undefined) {
    return [];
  }

  return (ctx.has("orpc") || ctx.has("effect-rpc")) && rpcPath(ctx) === "/rpc"
    ? ["/rpc", "/api"]
    : ["/api"];
};
