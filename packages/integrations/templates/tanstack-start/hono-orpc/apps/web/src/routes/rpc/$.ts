import { createFileRoute } from "@tanstack/react-router";

import { proxyToServer } from "#src/server/proxy.ts";

export const Route = createFileRoute("/rpc/$")({
  server: { handlers: { ANY: proxyToServer } },
});
