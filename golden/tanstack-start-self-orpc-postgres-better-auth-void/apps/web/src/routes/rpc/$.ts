import { createFileRoute } from "@tanstack/react-router";

import { handleRpc } from "#src/server/orpc.ts";

export const Route = createFileRoute("/rpc/$")({
  server: { handlers: { ANY: handleRpc } },
});
