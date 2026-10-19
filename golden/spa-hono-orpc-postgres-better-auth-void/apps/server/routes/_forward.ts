import { defineHandler } from "void";

import { createApp } from "#src/app.ts";
import { withServices } from "#src/context.ts";

export const forward = defineHandler(
  async (c) =>
    await withServices(
      async (services) => await createApp(services).fetch(c.req.raw)
    )
);
