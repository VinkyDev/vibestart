import handler, { createServerEntry } from "@tanstack/react-start/server-entry";

import { withServices } from "#src/server/context.ts";

export default createServerEntry({
  fetch: async (request, options) =>
    await withServices(
      request,
      async () => await handler.fetch(request, options)
    ),
});
