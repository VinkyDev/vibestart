import { createApp } from "#src/app.ts";
import { withServices } from "#src/context.ts";

export default {
  async fetch(request: Request) {
    return await withServices(
      async (services) => await createApp(services).fetch(request)
    );
  },
} satisfies ExportedHandler;
