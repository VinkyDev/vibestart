import { createFileRoute } from "@tanstack/react-router";

import { handleOpenApi } from "#src/server/orpc.ts";

export const Route = createFileRoute("/api/$")({
  server: { handlers: { ANY: handleOpenApi } },
});
