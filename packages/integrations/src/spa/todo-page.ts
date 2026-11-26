import type { Context } from "@vibestart/core";

import { replaceOnce, templateContent } from "#/templates.ts";

export const todoPageSource = (ctx: Context, set: string, path: string) => {
  const source = templateContent(ctx, set, path);

  return ctx.has("better-auth")
    ? source
    : replaceOnce(
        source,
        "Private to your account.",
        "Shared by everyone who opens the app.",
        path
      );
};
